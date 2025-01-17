import { World, compile, detectLanguage } from "../../js/karel";
// import { WorldViewController } from "./worldViewController";
import { EditorView } from "codemirror";
import { decodeRuntimeError } from "./errorCodes";
import { setLanguage } from "./editor/editor";
import { GetCurrentSetting } from "./settings";
import { throbber } from "./throbber";
import { getEditors } from "./editor/editorsInstances";
import { Callbacks } from "jquery";
import { CheckForBreakPointOnLine } from "./editor/editor.breakpoint";
import { clearUnderlineError, underlineError } from "./editor/editor.parseErrorUnderline";
import { testSkipFlag } from "./editor/editor.skippable";

type messageType = "info"|"success"|"error"|"raw"|"warning";
type MessageCallback = (message:string, type:messageType)=>void;
type ControllerState = "unstarted"| "running" | "finished" | "paused";
type StateChangeCallback = (caller:KarelController, newState:ControllerState)=>void;
type StepCallback = (caller:KarelController, newState:ControllerState)=>void;
type ResetCallback = (caller:KarelController)=>void;
type NewWorldCallback = (caller:KarelController, world:World, newInstance:boolean)=>void;
type CompileCallback = (caller:KarelController, success:boolean, language:string)=>void;
type SlowModeCallback = (caller:KarelController, limit:number)=>void;
class KarelController {
    
    private static instance:KarelController


    world: World;
    // desktopController: WorldViewController;
    running: boolean;
    private onMessage: MessageCallback[];
    private onStateChange: StateChangeCallback[];
    private onStep: StepCallback[];
    private onReset: ResetCallback[];
    private onNewWorld: NewWorldCallback[];
    private onCompile: CompileCallback[];
    private onSlowMode: SlowModeCallback[];
    private state : ControllerState;
    private endedOnError:boolean;
    private autoStepInterval:number;
    private drawFrameRequest : number;
    private autoStepping: boolean;
    private futureStepping:boolean

    constructor(world: World) {
        this.world = world;
        this.running = false;
        this.onMessage = [];
        this.onStateChange = [];
        this.onStep = [];
        this.onReset= [];
        this.onNewWorld= [];
        this.onCompile= [];
        this.onSlowMode = [];
        this.state = "unstarted";
        this.endedOnError = false;
        this.autoStepInterval = 0;
        this.autoStepping = false;
        this.futureStepping = false;

        KarelController.instance = this;
    }

    static GetInstance() {
        return KarelController.instance;
    }
    
    // SetDesktopController(desktopController: WorldViewController) {
    //     this.desktopController = desktopController;
    //     this.desktopController.SetWorld(this.world);
        
    //     this.OnStackChanges();
    // }

    Compile(notifyOnSuccess:boolean = true) {
        const mainEditor = getEditors()[0];
        let code = mainEditor.state.doc.toString();

        // let language: string = detectLanguage(code);
        let language = detectLanguage(code) as "java" | "pascal" | "ruby" | "none";
            
        if (language === "java" || language === "pascal") {
            setLanguage(mainEditor, language);
        }
        let response = null;
        try {
            clearUnderlineError(mainEditor)
            response = compile(code);
            //TODO: expand message       
            if (notifyOnSuccess)     
                this.SendMessage("Programa compilado correctamente", "info");
            this.NotifyCompile(true, language);
        } catch (e) {            
            //TODO: Expand error
            this.SendMessage(decodeError(e, language), "error");
            if (e.hash.loc) {
                const status = e.hash;
                underlineError(mainEditor, status.loc.first_line, status.loc.first_column, status.loc.last_column);
            }
            this.NotifyCompile(false, language);
            return null;
        }
        
        return response;
    }

    // FIXME This is code from karel.js that I'm not even sure if it's ever executed by the web app.
    validatorCallbacks(message) {
        console.log("validator said this: ", message);
    }
    
    IsAutoStepping(): boolean {
        return this.autoStepping;
    }

    GetState(): ControllerState {
        return this.state;
    }

    Reset() {        
        this.endedOnError = false;
        this.world.reset();
        this.running = false;
        this.ChangeState("unstarted");
        this.NotifyReset();
    }

    GetRuntime() {
        return this.world.runtime;
    }

    StartRun(): boolean {        
        this.endedOnError = false;
        this.SendMessage("<hr>", "raw");
        let compiled = this.Compile();
        if (compiled == null) {
            return false;
        }
        this.Reset();
        let runtime = this.GetRuntime();        
        runtime.load(compiled);
        runtime.disableStackEvents = false;
        // FIXME: We skip validators, they seem useless, but I'm unsure
        
        runtime.start();
        this.running = true;
        this.ChangeState("running");
        return true;        
    }

    Pause() {
        if (this.state !== "running") return;
        this.StopAutoStep();
        this.ChangeState("paused")
    }

    CheckForBreakPointOnCurrentLine():boolean {
        let runtime= this.GetRuntime();
        if (runtime.state.line >= 0) {            
            const mainEditor = getEditors()[0];
            let hasBreakpoint = CheckForBreakPointOnLine(mainEditor, runtime.state.line+1)       
            if (hasBreakpoint) {                    
                this.BreakPointMessage(runtime.state.line +1);
            }
            return hasBreakpoint;
           
        }
        return false;
      }
    


    Step() {
        if (!this.StartStep()) return;
        
        let runtime = this.GetRuntime();
        runtime.step();
        const mainEditor = getEditors()[0];

        if (testSkipFlag(mainEditor, runtime.state.line !== 0?runtime.state.line:1)) {
            this.StepOut();
        } else { 
            this.EndStep();
        }
    }

    StepOver() {
        if (!this.StartStep()) return;
        
        const runtime = this.GetRuntime();
        const startWStackSize = runtime.state.stackSize;
        runtime.step();
        if (runtime.state.stackSize > startWStackSize) {
            throbber.performTask(
                function  * () {
                    while (this.PerformAutoStep() && runtime.state.stackSize > startWStackSize) yield;
                    runtime.step();
                }.bind(this)
            )
            .then(()=> this.EndStep())
        } else {
            this.EndStep();
        }
    }

    StepOut() {
        if (!this.StartStep()) return;
        const runtime = this.GetRuntime();
        const startWStackSize = runtime.state.stackSize;
        if (startWStackSize === 0) {
            this.RunTillEnd();
            return;
        }
        this.futureStepping = true;
        throbber.performTask(
            function * () {
                while (this.PerformAutoStep() && runtime.state.stackSize >= startWStackSize) yield;
                this.futureStepping = false;
            }.bind(this)
        ).then(_=>this.EndStep());
    }

    StartAutoStep(delay:number) {        
        this.StopAutoStep(); //Avoid thread leak
        if (this.state === "finished") {
            return false;
        }
        this.autoStepping = true;
        if (!this.running) {
            if (!this.StartRun()) {
                //Code Failed
                return false;
            }
        }
        if (this.state !== "running") {
            this.ChangeState("running");
        }
        this.autoStepInterval = window.setInterval(
            ()=>{
                if (!this.running) {
                    this.StopAutoStep();
                    return;
                }
                if (this.futureStepping) {
                    //Is futureStepping, wait for it to end.
                    return;
                }
                this.Step();
            }, 
            delay
        );
        return true;
    }


    ChangeAutoStepDelay(delay:number) {
        if (!this.IsAutoStepping()) {
            return;
        }
        this.StartAutoStep(delay);
    }

    StopAutoStep() {
        this.autoStepping = false;
        if (this.autoStepInterval !== 0) {
            clearInterval(this.autoStepInterval);
            this.autoStepInterval = 0;
        }
    }


    EndedOnError() {
        return this.endedOnError;
    }
    async RunTillEnd(ignoreBreakpoints:boolean = false) {
        if (this.state === "finished") {
            return;
        }
        if (!this.running) {
            if (!this.StartRun()) {
                return;
            }
        }
        this.futureStepping = true;
        let runtime = this.GetRuntime();
        // runtime.disableStackEvents= false; // FIXME: This should only be done when no breakpoints
        // runtime.disableStackEvents= true; // FIXME: This should only be done when no breakpoints
        await throbber.performTask(function * () {
            while (this.PerformAutoStep(ignoreBreakpoints)) yield;
        }.bind(this)).then(()=> {
            this.futureStepping = false;
            if (!runtime.state.running) {
                this.EndMessage();
                this.ChangeState("finished");
            } else {
                this.Pause();
            }

            this.NotifyStep();
        });
    }

    RegisterMessageCallback(callback: MessageCallback) {
        this.onMessage.push(callback);
    }

    RegisterStateChangeObserver(callback: StateChangeCallback) {
        this.onStateChange.push(callback);
    }

    RegisterResetObserver(callback: ResetCallback) {
        this.onReset.push(callback);
    }

    RegisterNewWorldObserver(callback: NewWorldCallback) {
        this.onNewWorld.push(callback);
    }

    RegisterStepController(callback: StepCallback) {
        this.onStep.push(callback);
    }

    RegisterCompileObserver(callback: CompileCallback) {
        this.onCompile.push(callback);
    }

    RegisterSlowModeObserver(callback: SlowModeCallback) {
        this.onSlowMode.push(callback);
    }

    Resize(w:number, h:number) {
        this.Reset();
        this.world.resize(w, h);    
        this.NotifyNewWorld(false);
    }

    NewWorld() {
        this.Reset();
        const w = this.world.w;
        const h = this.world.h;
        this.world = new World(w, h);
        this.NotifyNewWorld(true);
        // this.OnStackChanges(); // This causes a bug where the pile is double
    }

    LoadWorld(world: Document) {
        this.world.load(world);
        this.NotifyNewWorld(false);
    }

    private StartStep() {
        if (this.state === "finished") {
            //Ignore if the code already finished running
            return false;
        }
        if (!this.running) {
            if (!this.StartRun()) {
                // Code Failed
                return false;
            }
        }
        return true;
    }

    private EndStep() {
        
        if (!this.GetRuntime().state.running) {            
            this.EndMessage();
            this.ChangeState("finished");
        }
        if (this.CheckForBreakPointOnCurrentLine()) {
            this.Pause();
            this.NotifyStep();
            return;
        }

        this.NotifyStep();
    }

    private PerformAutoStep(ignoreBreakpoints:boolean = false) {
        const runtime = this.GetRuntime();
        const result = runtime.step();
        const slowLimit = GetCurrentSetting().slowExecutionLimit; 
        if (runtime.state.ic >=  slowLimit&& !runtime.disableStackEvents) {
            runtime.disableStackEvents = true;
            this.SendMessage(`Karel alcanzó las ${slowLimit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} instrucciones, Karel cambiará al modo rápido de ejecución, la pila de llamadas dejará de actualizarse`, "warning");
            this.NotifySlowMode(slowLimit);
        }
        
        
        return result && (ignoreBreakpoints || !this.CheckForBreakPointOnCurrentLine());
    }

    private SendMessage(message: string, type: messageType) {
        this.onMessage.forEach((callback) => callback(message, type));
    }

    private NotifyStateChange() {
        this.onStateChange.forEach((callback) => callback(this, this.state));
    }

    private NotifyReset() {
        this.onReset.forEach((callback) => callback(this));
    }

    private NotifyNewWorld(usedNewInstance:boolean ) {
        this.onNewWorld.forEach((callback) => callback(this, this.world, usedNewInstance));
    }

    private NotifyStep() {
        this.onStep.forEach((callback) => callback(this, this.state));
    }
    private NotifyCompile(success:boolean, language:string) {
        this.onCompile.forEach((callback) => callback(this, success, language));
    }

    private NotifySlowMode(limit:number) {
        this.onSlowMode.forEach((callback)=>callback(this, limit));
    }

    
    private ChangeState(nextState: ControllerState) {
        this.state = nextState;
        this.NotifyStateChange();
    }

    private EndMessage() {
        let state = this.GetRuntime().state;
        if (state.error) {
            this.SendMessage(decodeRuntimeError(state.error, this.world.maxInstructions, this.world.maxStackSize), "error");            
            this.endedOnError = true;
            return;
        }
        this.SendMessage("Ejecucion terminada exitosamente!", "success");
        let inner = "";
        if (this.world.getDumps(World.DUMP_MOVE)){
            inner += `<li class="list-group-item d-flex justify-content-between align-items-start"><div class="ms-2 me-auto">Avanza </div><span class="badge bg-primary rounded-pill">${state.moveCount}</span></li>`
        }
        if (this.world.getDumps(World.DUMP_LEFT)) {
            inner += `<li class="list-group-item d-flex justify-content-between align-items-start"><div class="ms-2 me-auto">Gira izquierda </div><span class="badge bg-primary rounded-pill">${state.turnLeftCount}</span></li>`
        }
        if (this.world.getDumps(World.DUMP_PICK_BUZZER)) {
            inner += `<li class="list-group-item d-flex justify-content-between align-items-start"><div class="ms-2 me-auto">Coge zumbador </div><span class="badge bg-primary rounded-pill">${state.pickBuzzerCount}</span></li>`
        }
        if (this.world.getDumps(World.DUMP_LEAVE_BUZZER)) {
            inner += `<li class="list-group-item d-flex justify-content-between align-items-start"><div class="ms-2 me-auto">Deja zumbador</div> <span class="badge bg-primary rounded-pill">${state.leaveBuzzerCount}</span></li>`
        }
        if (inner !== "") {
             this.SendMessage(
                '<ul class="list-group list-group-flush">'+inner+ '</ul>', 
                "raw"
            )
        }
    }



    private BreakPointMessage(line:number) {
        this.SendMessage(`🔴 ${line}) Breakpoint `, "info");
    }
    


    
}
const ERROR_TOKENS = {
    pascal: {
      BEGINPROG: '"iniciar-programa"',
      BEGINEXEC: '"inicia-ejecución"',
      ENDEXEC: '"termina-ejecución"',
      ENDPROG: '"finalizar-programa"',
      DEF: '"define-nueva-instrucción"',
      PROTO: '"define-prototipo-instrucción"',
      RET: '"sal-de-instrucción"',
      AS: '"como"',
      HALT: '"apágate"',
      LEFT: '"gira-izquierda"',
      FORWARD: '"avanza"',
      PICKBUZZER: '"coge-zumbador"',
      LEAVEBUZZER: '"deja-zumbador"',
      BEGIN: '"inicio"',
      END: '"fin"',
      THEN: '"entonces"',
      WHILE: '"mientras"',
      DO: '"hacer"',
      REPEAT: '"repetir"',
      TIMES: '"veces"',
      DEC: '"precede"',
      INC: '"sucede"',
      IFZ: '"si-es-cero"',
      IFNFWALL: '"frente-libre"',
      IFFWALL: '"frente-bloqueado"',
      IFNLWALL: '"izquierda-libre"',
      IFLWALL: '"izquierda-bloqueada"',
      IFNRWALL: '"derecha-libre"',
      IFRWALL: '"derecha-bloqueada"',
      IFWBUZZER: '"junto-a-zumbador"',
      IFNWBUZZER: '"no-junto-a-zumbador"',
      IFBBUZZER: '"algún-zumbador-en-la-mochila"',
      IFNBBUZZER: '"ningún-zumbador-en-la-mochila"',
      IFN: '"orientado-al-norte"',
      IFS: '"orientado-al-sur"',
      IFE: '"orientado-al-este"',
      IFW: '"orientado-al-oeste"',
      IFNN: '"no-orientado-al-norte"',
      IFNS: '"no-orientado-al-sur"',
      IFNE: '"no-orientado-al-este"',
      IFNW: '"no-orientado-al-oeste"',
      ELSE: '"si-no"',
      IF: '"si"',
      NOT: '"no"',
      OR: '"o"',
      AND: '"y"',
      '(': '"("',
      ')': '")"',
      ';': '";"',
      NUM: 'un número',
      VAR: 'un nombre',
      EOF: 'el final del programa',
    },
    java: {
      CLASS: '"class"',
      PROG: '"program"',
      DEF: '"define"',
      RET: '"return"',
      HALT: '"turnoff"',
      LEFT: '"turnleft"',
      FORWARD: '"move"',
      PICKBUZZER: '"pickbeeper"',
      LEAVEBUZZER: '"putbeeper"',
      WHILE: '"while"',
      REPEAT: '"iterate"',
      DEC: '"pred"',
      INC: '"succ"',
      IFZ: '"iszero"',
      IFNFWALL: '"frontIsClear"',
      IFFWALL: '"frontIsBlocked"',
      IFNLWALL: '"leftIsClear"',
      IFLWALL: '"leftIsBlocked"',
      IFNRWALL: '"rightIsClear"',
      IFRWALL: '"rightIsBlocked"',
      IFWBUZZER: '"nextToABeeper"',
      IFNWBUZZER: '"notNextToABeeper"',
      IFBBUZZER: '"anyBeepersInBeeperBag"',
      IFNBBUZZER: '"noBeepersInBeeperBag"',
      IFN: '"facingNorth"',
      IFS: '"facingSouth"',
      IFE: '"facingEast"',
      IFW: '"facingWest"',
      IFNN: '"notFacingNorth"',
      IFNS: '"notFacingSouth"',
      IFNE: '"notFacingEast"',
      IFNW: '"notFacingWest"',
      ELSE: '"else"',
      IF: '"if"',
      NOT: '"!"',
      OR: '"||"',
      AND: '"&&"',
      '(': '"("',
      ')': '")"',
      BEGIN: '"{"',
      END: '"}"',
      ';': '";"',
      NUM: 'un número',
      VAR: 'un nombre',
      EOF: 'el final del programa',
    },
  };

function jumpable(line:number, column:number | null) {
    let c = column;
    if (column == null) {
        c=0;
    }
    const onclick = `karel.MoveEditorCursorToLine(${line}, ${c})`
    return `<a class="text-decoration-underline" href="#" title="Haz clic para ir al error" onclick="${onclick}">línea ${line}</a>`;
}

function decodeError(e, lan : "java"|"pascal"|"ruby"|"none") : string {
    if (lan === "ruby" || lan === "none") {
        return "Error de compilación, no se puede reconocer el lenguaje";
    }
    let status = e.hash;
    console.log(JSON.stringify(e))
    console.log(e)
    if (status == null) {
        return "Error de compilación";
    }
    let message = `Error de compilación en  la ${jumpable(status.line+1,status.loc?.first_column )}\n<br>\n<div class="card"><div class="card-body">`
    if (status.expected) {        
        let expectations = status.expected.map((x=>ERROR_TOKENS[lan][x.replace(/^'+/,"").replace(/'+$/,"") ]))        
        message += `Se encontró "${status.text}" cuando se esperaba ${ expectations.join(", ")}`
    } else {
        let errorString = `${e}`;
        if (errorString.includes("Undefined function")) {
            message += `La función <b>${status.text}</b> no esta definida`;
        } else if (errorString.includes("Unrecognized text")) {
            message += `Se encontro un token ilegal`;
        } else if (errorString.includes("Function redefinition")) {
            message += `La función <b>${status.text}</b> ya fue definida previamente`;
        } else if (errorString.includes("Prototype redefinition")) {
            message += `El prototipo <b>${status.text}</b> ya fue definido previamente`;
        } else if (errorString.includes("Unknown variable")) {
            message += `El parámetro <b>${status.text}</b> no está definido`;
        } else if (errorString.includes("Function parameter mismatch")) {
            if (status.parameters=== 2) {
                message += `La función <b>${status.text}</b> no acepta parámetro `;
            } else {
                message += `La función <b>${status.text}</b> esperaba un parámetro `;
            }
        } else if (errorString.includes("Prototype parameter mismatch")) {
            message += `La función <b>${status.text}</b> tiene un número distinto de parámetros que su prototipo `;
        } else {
            message += "Error desconocido"
        }
    }
    message+="</div></div>"
    return message;
}


export {KarelController, ControllerState};