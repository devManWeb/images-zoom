"use strict";

function closure(){

    let randomID = "";
    const CONFIGURATION_PARAMS = {
        MINIMUM_WIDTH : 600,
        OVERLAY_BACKGROUND_COLOR: "lightgrey",
        OVERLAY_BACKGROUND_OPACITY:0.9,
        REDUCTION_COEFF: 0.9,
        CLASS_FOR_IMAGES: "img-zoom",
        SECONDS_DELAY_FOR_LISTERNES: 1 //works if != 0 
    }

    return {
        /**
         * Generates a random ID that is not used on the page.
         * @returns {String} _rand_id_ + integers
         */
        generateRandomID(){
            const generated = "_rand_id_" + String(Math.random() * 10).replace(/[^0-9]/g,""); 
            const doesExist = document.getElementById(generated);
            if(doesExist){
                //if it is already present, the function is called again
                return generateRandomID();
            } else{
                randomID = generated;
                return generated;
            }
        },
         /**
         * @returns {String} ID of the overlay.
         */
        currentID(){
            return randomID;
        },
        /**
         * @returns {Object} configurations object.
         */
        params(){
            return CONFIGURATION_PARAMS;
        }
    }
}

const manager = closure();

/**
 * Manages the grey overlay a random ID that is not used on the page.
 * @param {Boolean} create - true to place the overlay, false to remove it
 */
function overlay(create){

    if(create === true){
        let divOverlay = document.createElement("div"); 
        divOverlay.id = manager.generateRandomID();
        divOverlay.style.position = "fixed";
        divOverlay.style.top = "0px";
        divOverlay.style.left = "0px";
        divOverlay.style.width = "100%";
        divOverlay.style.height = "100%";
        divOverlay.style.background = manager.params().OVERLAY_BACKGROUND_COLOR;
        divOverlay.style.opacity = manager.params().OVERLAY_BACKGROUND_OPACITY;
        document.body.appendChild(divOverlay);

    } else if(create === false){
        const currentID = manager.currentID();
        const oldDiv = document.getElementById(currentID);
        //this also removes the event listener
        document.body.removeChild(oldDiv);
    }
}

/**
 * @returns {Number} the largest zIndex used on the page
 * @trows error in case the largest zIndex is large than Number.MAX_VALUE - 1
 */
function findHighestZIndex(){
    const allPageElements = document.getElementsByTagName("*");
    let highestZIndexFound = 0;
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
 * @param {Object} referenceImage - DOM object
 */
function imageZoomLogic(referenceImage){
    /**
     * Calculates the style for the zoomed image
     *  also takes care of positioning the photo on the screen
     * @param {Object} image - DOM object
     */
    function applyCalCStyle(image){

        const AVAILABLE_WIDTH = window.innerWidth;
        const AVAILABLE_HEIGHT = window.innerHeight
        const IMAGE_WIDTH = image.width;
        const IMAGE_HEIGHT = image.height;
        const IMAGE_RATIO = IMAGE_WIDTH/IMAGE_HEIGHT;

        if(AVAILABLE_WIDTH <= AVAILABLE_HEIGHT){
            if(IMAGE_WIDTH < IMAGE_HEIGHT){
                image.height = AVAILABLE_HEIGHT * manager.params().REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            } else {
                image.width = AVAILABLE_WIDTH * manager.params().REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        } else {
            if(IMAGE_WIDTH < IMAGE_HEIGHT){
                image.height = AVAILABLE_HEIGHT * manager.params().REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            } else {
                image.width = AVAILABLE_WIDTH * manager.params().REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        }
        
        image.style.top = (AVAILABLE_HEIGHT - image.height) / 2 + "px";
        image.style.left = (AVAILABLE_WIDTH - image.width) / 2 + "px";;  
    }

    //if src is not definied or if the width is too small
    //this section will not work at all
    if(
        referenceImage.src !== "" && 
        window.innerWidth > manager.params().MINIMUM_WIDTH
    ){
        overlay(true);
        
        let newImage = document.createElement("img");
        newImage.style.position = "fixed";
        newImage.width = referenceImage.width;
        newImage.height = referenceImage.height;
        try{
            newImage.style.zIndex = findHighestZIndex() + 1;
        } catch(e){
            newImage.style.zIndex = 1000;
        }
        applyCalCStyle(newImage);  
        newImage.src = referenceImage.src;
        document.body.appendChild(newImage);

        //readjusts the style of the enlarged photo with the resize of the page
        const resizeForThisImage = window.addEventListener("resize", function(){
            applyCalCStyle(newImage);
        }); 
        
        //if the user clicks anywhere on the screen, closes the view
        const overlayElem = document.getElementById(manager.currentID());
        newImage.addEventListener("click", function(){
            overlay(false);
            window.removeEventListener("resize", resizeForThisImage);
            //this also removes the event listener
            document.body.removeChild(newImage);
        });
        overlayElem.addEventListener("click", function(){
            overlay(false);
            window.removeEventListener("resize", resizeForThisImage);
            document.body.removeChild(newImage);
        });
    }
}


window.addEventListener('DOMContentLoaded', function() {
    
    /**
     * Puts a listener for each image with the class specified in CONFIGURATION_PARAMS
     */
    function loadListeners(){
        const classToUse = manager.params().CLASS_FOR_IMAGES;
        const imagesToZoom = document.getElementsByClassName(classToUse);
        for (let i = 0; i < imagesToZoom.length; i++) {
            imagesToZoom[i].addEventListener("click", function(){
                imageZoomLogic(imagesToZoom[i]);
            }); 
        }
    }

    const secondsDelay = manager.params().SECONDS_DELAY_FOR_LISTERNES;
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

