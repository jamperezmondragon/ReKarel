import { DesktopController } from "./desktop-ui";
import { responsiveHack, SetResponsiveness, SetDesktopView, SetPhoneView } from "./responsive-load";
import { DefaultWRStyle, WRStyle } from "./worldRenderer";

const APP_SETTING = 'appSettings';

type fontSizes = number;
type responsiveInterfaces = "auto" | "desktop" | "mobile";

type AppSettings = {
    interface: responsiveInterfaces,
    editorFontSize: fontSizes,
    worldRendererStyle: WRStyle
    
}

let appSettings: AppSettings = {
    interface: "desktop",
    editorFontSize: 12,
    worldRendererStyle: DefaultWRStyle
}

function isFontSize(str: number): str is fontSizes {
    return 6 < str && str < 31;
}
function isResponsiveInterfaces(str: string): str is responsiveInterfaces {
    return ["auto", "desktop", "mobile"].indexOf(str) > -1;
}
let DesktopUI: DesktopController

function applySettings(settings: AppSettings, desktopUI:DesktopController) {
    switch (settings.interface) {
        case "auto":
            SetResponsiveness();
            break;
        case "desktop":
            SetDesktopView();
            break;
        case "mobile":
            SetPhoneView();
            break;
        default:
            SetDesktopView();
            break;
    }
    $(":root")[0].style.setProperty("--editor-font-size", `${settings.editorFontSize}pt`);
    if (settings.interface == "desktop")
        desktopUI.ResizeCanvas();
    desktopUI.worldController.renderer.style = settings.worldRendererStyle;
    desktopUI.worldController.Update();
    localStorage.setItem(APP_SETTING, JSON.stringify(appSettings))

    
}

function setSettings(event:  JQuery.SubmitEvent<HTMLElement, undefined, HTMLElement, HTMLElement>, desktopUI:DesktopController) {
    let interfaceType = <string>$("#settingsForm select[name=interface]").val();
    let fontSize = <number>$("#settingsForm input[name=fontSize]").val();
    console.log(fontSize);
    if (isResponsiveInterfaces(interfaceType)) {
        appSettings.interface = interfaceType;
    }
    if (isFontSize(fontSize)) {
        appSettings.editorFontSize = fontSize;
    }

    console.log(appSettings);
    applySettings(appSettings, desktopUI);


    event.preventDefault();
    return false;
}

function loadSettingsFromMemory() {
    const jsonString = localStorage.getItem(APP_SETTING);
    if (jsonString) {
        appSettings = JSON.parse(jsonString);
    } 
    
   
    

}

function loadSettingsToModal() {
    console.log("show", appSettings)
    $("#settingsInterface").val(appSettings.interface );
    $("#settingsFontSize").val(appSettings.editorFontSize);
}

export function InitSettings(desktopUI:DesktopController) {    
    DesktopUI = desktopUI;
    loadSettingsFromMemory();
    $("#settingsModal").on("show.bs.modal", (e)=> {
        loadSettingsToModal();
    });

    $("#settingsForm").on("submit", (e)=> {
        setSettings(e , desktopUI)
    });
    
    
}



export function StartSettings(desktopUI:DesktopController) {

    applySettings(appSettings, desktopUI);
        
    $(document).on("keydown", (e) => {
        if (e.ctrlKey && e.which === 75) {
            let fontSize = appSettings.editorFontSize;
            fontSize--;
            if (fontSize < 7) fontSize = 7;
            appSettings.editorFontSize = fontSize;
            applySettings(appSettings, desktopUI);
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.which === 76) {
            let fontSize = appSettings.editorFontSize;
            fontSize++;
            if (fontSize > 30) fontSize = 30;
            appSettings.editorFontSize = fontSize;
            applySettings(appSettings, desktopUI);
            e.preventDefault();
            return false;
        }

    });
}


export function SetWorldRendererStyle(style :WRStyle) {
    appSettings.worldRendererStyle = style;
    applySettings(appSettings, DesktopUI);
}


export function GetCurrentSetting(){ return appSettings;}