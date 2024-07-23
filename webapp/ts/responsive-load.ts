import { getEditors } from "./editor/editorsInstances";


let mode:"mobile"|"desktop"|"responsive"="responsive";

function clearAllDisplayClasses(element: string) {    
    $(element).removeClass( "d-none" );
    $(element).removeClass( "d-lg-block");    
    $(element).removeClass( "d-lg-none");
}
function hideElement(element: string) {    
    $(element).addClass( "d-none" );
}
function SetResponsiveness() {
    mode = "responsive";
    
    clearAllDisplayClasses("#desktopView");    
    clearAllDisplayClasses("#phoneView");

    $("#phoneView").addClass( "d-lg-none" );
    $("#desktopView").addClass( "d-none" );
    $("#desktopView").addClass( "d-lg-flex");
}

function SetDesktopView() {
    mode = "desktop";
    clearAllDisplayClasses("#phoneView");
    clearAllDisplayClasses("#desktopView");
    hideElement("#phoneView");
    MoveEditor("desktop")
    
}
function SetPhoneView() {
    mode = "mobile";
    clearAllDisplayClasses("#phoneView");
    clearAllDisplayClasses("#desktopView");
    hideElement("#desktopView");
    MoveEditor("mobile")

}

function MoveEditor(target:"mobile"|"desktop") {

    const editor = getEditors()[0];
    const dom = $(editor.dom);
    dom.detach();
    if (target === "mobile") {
        $("#mobileCodePanel").append(dom);
    } else {
        $("#splitter-left-top-pane").append(dom);
    }
}

let previousResponsiveMode:"desktop"|"mobile" = "desktop";
let phoneView =$("#phoneView");
let desktopView =$("#desktopView");
function checkVisibility() {
    if (mode !== "responsive") 
        return;
    if (previousResponsiveMode === "desktop") {
        if (phoneView.css("display")!=="none") {
            previousResponsiveMode = "mobile";
            MoveEditor("mobile");
        }
        return;
    }
    
    if (previousResponsiveMode === "mobile") {
        if (desktopView.css("display")!=="none") {
            previousResponsiveMode = "desktop";
            MoveEditor("desktop");
        }
        return;
    }

}
function responsiveHack() {
    
    $(window).on('resize', checkVisibility);

    $("#phoneView").removeClass( "position-absolute" );
    if (false) {
        $("#phoneView").addClass( "d-lg-none" );
        $("#desktopView").addClass( "d-none" );
        $("#desktopView").addClass( "d-lg-block");
        $("#phoneView").removeClass( "position-absolute" );
    } else {
        $("#phoneView").addClass( "d-none" );
    }
    
    $("#loadingModal").remove();
    setTimeout(()=>checkVisibility());
}

export {responsiveHack, SetResponsiveness, SetDesktopView, SetPhoneView}