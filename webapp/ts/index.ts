import { splitPanels } from "./split";
import { responsiveHack } from "./responsive-load";
import { createEditors } from "./editor";
import { GetDesktopUIHelper } from "./desktop-ui";
import { GetPhoneUIHelper } from "./phone-ui";
import { HookUpCommonUI, SetText } from "./common-ui";

splitPanels();

var [destkopEditor, phoneEditor] = createEditors();
//TODO: ThisShouldnt be here
function hideElement(element:string) {
    $(element).addClass("d-none");
}
function showElement(element:string) {
    $(element).removeClass("d-none");    
}

HookUpCommonUI(
    {
        editor:destkopEditor,
        downloadModal: {
            modal: "#saveCodeModal",
            confirmBtn: "#downloadCodeBtn",
            inputField: "#codeName",
            wrongCodeWarning:"#wrongCodeName",
        },
        confirmModal: {
            modal: "#confirmModal",
            titleField: "#confirmModalTitle",
            messageField: "#confirmModalMessage",
            confirmBtn: "#confirmModalYes",
            rejectBtn: "#confirmModalNo",
        },
        confirmCallers: [
            {
                button: "#newJavaCodeNavBtn",
                data: {
                    accept: ()=>{
                        SetText(
                            destkopEditor, 
                            "class program {\n\tprogram () {\n\t\t// TODO poner codigo aqui\n\t\tturnoff();\n\t}\n}"
                        ); 
                    },
                    message:"Perderás todo el código no guardado!",
                    title: "Nuevo código Java",
                    reject: ()=>{ },
                }
            },
            
            {
                button: "#newPascalCodeNavBtn",
                data: {
                    accept: ()=>{
                        SetText(
                            destkopEditor, 
                            "iniciar-programa\n\tinicia-ejecucion\n\t\t{ TODO poner codigo aqui }\n\t\tapagate;\n\ttermina-ejecucion\nfinalizar-programa"
                        ); 
                    },
                    message:"Perderás todo el código no guardado!",
                    title: "Nuevo código Pascal",
                    reject: ()=>{ },
                }
            },
        ]
    }
)
let DesktopUI = GetDesktopUIHelper();
let PhoneUI = GetPhoneUIHelper({
    editor: phoneEditor,
    codeIndent: "#codeIndent",
    codeUnindent: "#codeUnindent",
    navToolbar: {
        "#codeTabBtn": () => "",
        "#worldTabBtn": () => "",
        "#execTabBtn": () => "",
        "#settingTabBtn": () => ""
    },
    codeTabToolbar: {
        "#codeEdit": () => {                        
            hideElement("#editToolbar");
            hideElement("#pascalAction");
            hideElement("#pascalFlow");
            hideElement("#pascalKeyword");

            showElement("#editToolbar");
            return "";
        },
        "#codeAction": () => {                        
            hideElement("#editToolbar");
            hideElement("#pascalAction");
            hideElement("#pascalFlow");
            hideElement("#pascalKeyword");

            showElement("#pascalAction");
            return "";
        },
        "#codeFlow": () => {            
            hideElement("#editToolbar");
            hideElement("#pascalAction");
            hideElement("#pascalFlow");
            hideElement("#pascalKeyword");
            
            showElement("#pascalFlow");
            return "";
        },
        "#codeKeyword": () => {            
            hideElement("#editToolbar");
            hideElement("#pascalAction");
            hideElement("#pascalFlow");
            hideElement("#pascalKeyword");

            showElement("#pascalKeyword");
            return "";
        }
    },
    simpleCodeInputs: {
        "#pAvanza":()=>"avanza;",
        "#pGira":()=>"gira-izquierda;",
        "#pCoge":()=>"coge-zumbador;",
        "#pDeja":()=>"deja-zumbador;",
        "#pApagate":()=>"apagate;",
        "#pSalir":()=>"sal-de-instruccion;",
    }
})

//Activate default states
PhoneUI.changeCodeToolbar("#codeAction");
PhoneUI.changeNavToolbar("#codeTabBtn");
//Hoock all UI
$("#infiniteBeepersBtn").click(DesktopUI.toggleInfinityBeepers);


$(document).ready(()=>{
    responsiveHack();
})
