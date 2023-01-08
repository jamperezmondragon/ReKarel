import { redoDepth } from '@codemirror/history';
import bootstrap from 'bootstrap';
import { WorldRenderer } from './worldRenderer';

let renderer: WorldRenderer = undefined;

function ResizeDesktopCanvas() {    
    $("#worldCanvas").attr("width", $("#worldContainer")[0].clientWidth);    
    $("#worldCanvas").attr("height", $("#worldContainer")[0].clientHeight);

    renderer.Draw();        
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
    function p() {
        dumb.show();
        toggler.off("hidden.bs.dropdown",p);
    };
    dumb.show();
   
}
//TODO: Add support for states
function GetDesktopUIHelper() {
    renderer = new WorldRenderer(($("#worldCanvas")[0] as HTMLCanvasElement).getContext("2d"));
    // $("#worldCanvas").on("contextmenu", (e) => {
    //     const dumb =new bootstrap.Dropdown($("#contextMenuToggler")[0]);
    
    //     dumb.hide();
    //     console.log(e);  
    //     $("#contextMenuDiv")[0].style.setProperty("top", `${e.pageY}px`);
    //     $("#contextMenuDiv")[0].style.setProperty("left", `${e.pageX}px`);      
    //     ToggleConextMenu();
    //     e.preventDefault();
                
    $("#worldContainer").on("scroll", ()=> {
        let left = 
            $("#worldContainer").scrollLeft() 
            / ($("#worldContainer")[0].scrollWidth-$("#worldContainer")[0].clientWidth);
        let top 
            = 1-$("#worldContainer").scrollTop() 
            / ($("#worldContainer")[0].scrollHeight-$("#worldContainer")[0].clientHeight);
        renderer.UpdateScroll(left, top);
         
    });
    $(window).on("resize", () => {        
        ResizeDesktopCanvas();
    });
    return {
        toggleInfinityBeepers : toggleInfinityBeepers,
        renderer: renderer,
        ResizeDesktopCanvas: ResizeDesktopCanvas

    };
}



export {GetDesktopUIHelper, ToggleConextMenu, ResizeDesktopCanvas};