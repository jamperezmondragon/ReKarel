import { redoDepth } from '@codemirror/history';
import bootstrap from 'bootstrap';
import { WorldRenderer, WRStyle } from './worldRenderer';
import { WorldController } from "./worldController";
import { World } from '../../js/karel';


let renderer: WorldRenderer = undefined;
let controller: WorldController = undefined;

function scrollCanvas() {
    let left = 
        ($("#worldContainer")[0].scrollWidth-$("#worldContainer")[0].clientWidth)!==0?
            $("#worldContainer").scrollLeft() 
            / ($("#worldContainer")[0].scrollWidth-$("#worldContainer")[0].clientWidth)
            :1;
    let top =
        ($("#worldContainer")[0].scrollHeight-$("#worldContainer")[0].clientHeight)!==0?
            1-$("#worldContainer").scrollTop() 
            / ($("#worldContainer")[0].scrollHeight-$("#worldContainer")[0].clientHeight)
            :1;
    controller.UpdateScroll(left, top);
}

function ResizeDesktopCanvas() {    
    $("#worldCanvas")[0].style.width= `${$("#worldContainer")[0].clientWidth}px`;    
    $("#worldCanvas")[0].style.height= `${$("#worldContainer")[0].clientHeight}px`;
    let scale = window.devicePixelRatio;
    $("#worldCanvas").attr(
        "width", Math.floor($("#worldContainer")[0].clientWidth * scale)
    );    
    $("#worldCanvas").attr(
        "height", Math.floor($("#worldContainer")[0].clientHeight * scale)
    );

    controller.Update();        
    scrollCanvas();
}

function toggleInfinityBeepers () {
    if ($("#beeperBag").attr("hidden")!== undefined) { 
        $("#beeperBag").removeAttr("hidden");
        $("#beeperBag").val("0");
        $("#infiniteBeepersBtn").removeClass("btn-info");
        
        $("#infiniteBeepersBtn").addClass("btn-light");            
    } else {
        $("#beeperBag").attr("hidden", "");
        $("#beeperBag").val("-1");
        $("#infiniteBeepersBtn").removeClass("btn-light");            
        $("#infiniteBeepersBtn").addClass("btn-info");
    }
}


function ToggleConextMenu() {
    // $("#contextMenuToggler")[0].click();
    let toggler = $("#contextMenuToggler");
    const dumb =new bootstrap.Dropdown(toggler[0]);
    if (toggler.attr("aria-expanded")==="false") {
        dumb.show();
    } else {
        dumb.hide();
    }
   
}
//TODO: Add support for states
const lightWRStyle : WRStyle = {
    disabled: '#4f4f4f',
    exportCellBackground: '#f5f7a8',
    karelColor: '#3E6AC1',
    gridBackgroundColor: '#f8f9fA',
    gridBorderColor: '#c4c4c4',
    gutterBackgroundColor: '#e6e6e6',
    gutterColor: "#444444",
    beeperBackgroundColor: "#0ADB23",    
    beeperColor: "#000000"
}
function GetDesktopUIHelper(world: World) {
    renderer = new WorldRenderer(
        ($("#worldCanvas")[0] as HTMLCanvasElement).getContext("2d"),
        lightWRStyle   
    );
    controller = new WorldController(
        renderer,
        $("#worldContainer")[0] ,
        world,
        {
            selectionBox: {
                main: $("#desktopBoxSelect")[0],
                bottom: $("#desktopBoxSelect [name='bottom']")[0],
                top: $("#desktopBoxSelect [name='top']")[0],
                left: $("#desktopBoxSelect [name='left']")[0],
                right: $("#desktopBoxSelect [name='right']")[0],
            }
        }
    );
    $("#worldCanvas").on("contextmenu", (e) => {
        const dumb =new bootstrap.Dropdown($("#contextMenuToggler")[0]);
        dumb.hide();
        $("#contextMenuDiv")[0].style.setProperty("top", `${e.pageY}px`);
        $("#contextMenuDiv")[0].style.setProperty("left", `${e.pageX}px`);      
        ToggleConextMenu();
        e.preventDefault();
    });

    
    $("#worldContainer").on("scroll", scrollCanvas);
    $(window).on("resize", () => {        
        ResizeDesktopCanvas();
    });
    controller.FocusOrigin();


    $("#worldCanvas").on("mouseup", controller.ClickUp.bind(controller)); 
    $("#worldCanvas").on("mousemove", controller.TrackMouse.bind(controller));
    
    $("#desktopGoHome").on("click", ()=>controller.FocusOrigin());
    $("#desktopGoKarel").on("click", ()=>controller.FocusKarel());
    
    $("#desktopKarelNorth").on("click", ()=>controller.SetKarelOnSelection("north"));
    $("#desktopKarelEast").on("click", ()=>controller.SetKarelOnSelection("east"));
    $("#desktopKarelSouth").on("click", ()=>controller.SetKarelOnSelection("south"));
    $("#desktopKarelWest").on("click", ()=>controller.SetKarelOnSelection("west"));
    
    $("#desktopAddBeeper").on("click", ()=>controller.ChangeBeepers(1));
    $("#desktopDecrementBeeper").on("click", ()=>controller.ChangeBeepers(-1));
    $("#desktopRemoveAll").on("click", ()=>controller.SetBeepers(0));

    $("#contextKarelNorth").on("click", ()=>{
        ToggleConextMenu();
        controller.SetKarelOnSelection("north");
    });
    $("#contextKarelEast").on("click", ()=>{        
        ToggleConextMenu();
        controller.SetKarelOnSelection("east");
    });
    $("#contextKarelSouth").on("click", ()=>{        
        ToggleConextMenu();
        controller.SetKarelOnSelection("south");
    });
    $("#contextKarelWest").on("click", ()=>{        
        ToggleConextMenu();
        controller.SetKarelOnSelection("west");
    });
    $("#contextAddBeeper").on("click", ()=>{
        ToggleConextMenu();
        controller.ChangeBeepers(1);
    });
    $("#contextDecrementBeeper").on("click", ()=>{
        ToggleConextMenu();
        controller.ChangeBeepers(-1);
    });
    $("#contextRemoveAll").on("click", ()=>{
        ToggleConextMenu();
        controller.SetBeepers(0);
    });

    

    return {
        toggleInfinityBeepers : toggleInfinityBeepers,
        renderer: renderer,
        controller: controller,
        ResizeDesktopCanvas: ResizeDesktopCanvas

    };
}

function DesktopKeyUp(e: JQuery.KeyUpEvent) {
    let tag = e.target.tagName.toLowerCase();
    if (document.activeElement.getAttribute("role")=="textbox" || tag=="input") {
        return;
    }

    let hotkeys = new Map<number, ()=>void>([
        [71,()=>{controller.ToggleKarelPosition();}],
        [82,()=>{controller.SetBeepers(0);}],
        [81,()=>{controller.ChangeBeepers(-1);}],
        [69,()=>{controller.ChangeBeepers(1);}],
    ]);
    hotkeys.forEach((value:()=>void, key:number) => {
        if (e.which === key) {
            if (e.shiftKey) {
                let dummy: MouseEvent = new MouseEvent("", {
                    clientX: e.clientX,
                    clientY: e.clientY,
                });
                controller.ClickUp(dummy);
            }
            value();
        }
    });
    console.log(tag);
}


export {GetDesktopUIHelper, DesktopKeyUp, ResizeDesktopCanvas};