"use strict";


interface Configuration {
    [index: string]: string | number;   //used to read the values
    MINIMUM_WIDTH:                      number;
    OVERLAY_BACKGROUND_COLOR:           string;
    OVERLAY_BACKGROUND_OPACITY:         number;
    REDUCTION_COEFF:                    number;
    CLASS_FOR_IMAGES:                   string;
    SECONDS_DELAY_FOR_LISTENERS:        number;
}

function closure(){

    let randomID = "";
    const CONFIGURATION_PARAMS:Configuration = {
        MINIMUM_WIDTH :                 600,
        OVERLAY_BACKGROUND_COLOR:       "lightgrey",
        OVERLAY_BACKGROUND_OPACITY:     0.9,
        REDUCTION_COEFF:                0.9,
        CLASS_FOR_IMAGES:               "img-zoom",
        SECONDS_DELAY_FOR_LISTENERS:    1 //works if > 0
    }

    return {
        /**
         * Generates a random ID that is not used on the page.
         * @returns {string} _rand_id_ + integers
         */
        generateRandomID():string{
            const generated = "_rand_id_" + String(Math.random() * 10).replace(/[^0-9]/g,""); 
            const doesExist:HTMLElement | null = document.getElementById(generated);
            if(doesExist){
                //if it is already present, the function is called again
                return this.generateRandomID();
            } else{
                randomID = generated;
                return generated;
            }
        },
         /**
         * @returns {string} ID of the overlay.
         */
        currentID():string{
            return randomID;
        },
        /**
         * @param {string} configurations object item name.
         * @returns {Object} configurations object item value.
         */
        param(configurationItem:string):(number | string){
            return CONFIGURATION_PARAMS[configurationItem];
        }
    }
}

const manager = closure();

/**
 * Manages the grey overlay a random ID that is not used on the page.
 * @param {boolean} create - true to place the overlay, false to remove it
 */
function overlay(create:boolean){

    if(create === true){
        let divOverlay:HTMLDivElement = document.createElement("div"); 
        divOverlay.id = manager.generateRandomID();
        divOverlay.style.position = "fixed";
        divOverlay.style.top = "0px";
        divOverlay.style.left = "0px";
        divOverlay.style.width = "100%";
        divOverlay.style.height = "100%";
        divOverlay.style.background = String(manager.param("OVERLAY_BACKGROUND_COLOR"));
        divOverlay.style.opacity = String(manager.param("OVERLAY_BACKGROUND_COLOR"));
        document.body.appendChild(divOverlay);

    } else if(create === false){
        const currentID = manager.currentID();
        const oldDiv = document.getElementById(currentID) as HTMLDivElement;
        //this also removes the event listener
        document.body.removeChild(oldDiv);
    }
}

/**
 * @returns {number} the largest zIndex used on the page
 * @trows error in case the largest zIndex is large than Number.MAX_VALUE - 1
 */
function findHighestZIndex():number{
    const allPageElements = document.getElementsByTagName("*") as HTMLCollectionOf<HTMLElement>;
    let highestZIndexFound:number = 0;
    for (let i = 0; i < allPageElements.length; i++){
        const elementStyle = getComputedStyle(allPageElements[i]);
        const elementZIndex = parseInt(elementStyle.getPropertyValue('z-index'), 10);
        if(elementZIndex > highestZIndexFound){
            highestZIndexFound = elementZIndex;
        }
    }
    if (highestZIndexFound < Number.MAX_VALUE - 1){
        return highestZIndexFound;
    } else {
        throw("Maximum Zindex number reached");
    }
}

/**
 * manages the appearance/disappearance of the zoomed image and the background
 * @param referenceImage
 */
function imageZoomLogic(referenceImage:HTMLImageElement){
    /**
     * Calculates the style for the zoomed image
     *  also takes care of positioning the photo on the screen
     * @param image
     */
    function applyCalCStyle(image:HTMLImageElement){

        const AVAILABLE_WIDTH = window.innerWidth;
        const AVAILABLE_HEIGHT = window.innerHeight
        const IMAGE_WIDTH = image.width;
        const IMAGE_HEIGHT = image.height;
        const IMAGE_RATIO = IMAGE_WIDTH/IMAGE_HEIGHT;
        const REDUCTION_COEFF = Number(manager.param("REDUCTION_COEFF"));

        if(AVAILABLE_WIDTH <= AVAILABLE_HEIGHT){
            if(IMAGE_WIDTH < IMAGE_HEIGHT){
                image.height = AVAILABLE_HEIGHT * REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            } else {
                image.width = AVAILABLE_WIDTH * REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        } else {
            if(IMAGE_WIDTH < IMAGE_HEIGHT){
                image.height = AVAILABLE_HEIGHT * REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            } else {
                image.width = AVAILABLE_WIDTH * REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        }
        
        image.style.top = (AVAILABLE_HEIGHT - image.height) / 2 + "px";
        image.style.left = (AVAILABLE_WIDTH - image.width) / 2 + "px";;  
    }

    /*
    * if src is not defined or if the width is too small
    * this section will not work at all
    */
    if(
        referenceImage.src !== "" && 
        window.innerWidth > manager.param("MINIMUM_WIDTH")
    ){
        overlay(true);
        
        let newImage:HTMLImageElement = document.createElement("img");
        newImage.style.position = "fixed";
        newImage.width = referenceImage.width;
        newImage.height = referenceImage.height;
        try{
            newImage.style.zIndex = String(findHighestZIndex() + 1);
        } catch(e){
            newImage.style.zIndex = "1000";
        }
        applyCalCStyle(newImage);  
        newImage.src = referenceImage.src;
        document.body.appendChild(newImage);

        /**
        * readjusts the style of the enlarged photo with the resize of the page
        */
        window.addEventListener("resize", function(){
            applyCalCStyle(newImage);
        });

        //if the user clicks anywhere on the screen, closes the view
        const overlayElem = document.getElementById(manager.currentID()) as HTMLElement;
        newImage.addEventListener("click", function(){
            overlay(false);
            window.removeEventListener("resize",  function(){
                applyCalCStyle(newImage);
            });
            //this also removes the event listener
            document.body.removeChild(newImage);
        });
        overlayElem.addEventListener("click", function(){
            overlay(false);
            window.removeEventListener("resize",  function(){
                applyCalCStyle(newImage);
            });
            document.body.removeChild(newImage);
        });
    }
}


window.addEventListener('DOMContentLoaded', function() {
    
    /**
     * Puts a listener for each image with the class specified in CONFIGURATION_PARAMS
     */
    function loadListeners(){
        const classToUse = String(manager.param("CLASS_FOR_IMAGES"));
        const imagesToZoom = document.getElementsByClassName(classToUse) as HTMLCollectionOf<HTMLImageElement>;
        for (let i = 0; i < imagesToZoom.length; i++) {
            imagesToZoom[i].addEventListener("click", function(){
                imageZoomLogic(imagesToZoom[i]);
            }); 
        }
    }

    const secondsDelay = manager.param("SECONDS_DELAY_FOR_LISTENERS");
    if(
        typeof(secondsDelay) === "number" &&
        secondsDelay > 0
    ){
        setTimeout(
            loadListeners,
            secondsDelay * 1000
        );
    } else {
        loadListeners();
    }
});

