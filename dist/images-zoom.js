"use strict";
function closure() {
    var randomID = "";
    var CONFIGURATION_PARAMS = {
        MINIMUM_WIDTH: 600,
        OVERLAY_BACKGROUND_COLOR: "lightgrey",
        OVERLAY_BACKGROUND_OPACITY: 0.9,
        REDUCTION_COEFF: 0.9,
        CLASS_FOR_IMAGES: "img-zoom",
        SECONDS_DELAY_FOR_LISTENERS: 1 //works if > 0
    };
    return {
        /**
         * Generates a random ID that is not used on the page.
         * @returns {string} _rand_id_ + integers
         */
        generateRandomID: function () {
            var generated = "_rand_id_" + String(Math.random() * 10).replace(/[^0-9]/g, "");
            var doesExist = document.getElementById(generated);
            if (doesExist) {
                //if it is already present, the function is called again
                return this.generateRandomID();
            }
            else {
                randomID = generated;
                return generated;
            }
        },
        /**
        * @returns {string} ID of the overlay.
        */
        currentID: function () {
            return randomID;
        },
        /**
         * @param {string} configurations object item name.
         * @returns {Object} configurations object item value.
         */
        param: function (configurationItem) {
            return CONFIGURATION_PARAMS[configurationItem];
        }
    };
}
var manager = closure();
/**
 * Manages the grey overlay a random ID that is not used on the page.
 * @param {boolean} create - true to place the overlay, false to remove it
 */
function overlay(create) {
    if (create === true) {
        var divOverlay = document.createElement("div");
        divOverlay.id = manager.generateRandomID();
        divOverlay.style.position = "fixed";
        divOverlay.style.top = "0px";
        divOverlay.style.left = "0px";
        divOverlay.style.width = "100%";
        divOverlay.style.height = "100%";
        divOverlay.style.background = String(manager.param("OVERLAY_BACKGROUND_COLOR"));
        divOverlay.style.opacity = String(manager.param("OVERLAY_BACKGROUND_COLOR"));
        document.body.appendChild(divOverlay);
    }
    else if (create === false) {
        var currentID = manager.currentID();
        var oldDiv = document.getElementById(currentID);
        //this also removes the event listener
        document.body.removeChild(oldDiv);
    }
}
/**
 * @returns {number} the largest zIndex used on the page
 * @trows error in case the largest zIndex is large than Number.MAX_VALUE - 1
 */
function findHighestZIndex() {
    var allPageElements = document.getElementsByTagName("*");
    var highestZIndexFound = 0;
    for (var i = 0; i < allPageElements.length; i++) {
        var elementStyle = getComputedStyle(allPageElements[i]);
        var elementZIndex = parseInt(elementStyle.getPropertyValue('z-index'), 10);
        if (elementZIndex > highestZIndexFound) {
            highestZIndexFound = elementZIndex;
        }
    }
    if (highestZIndexFound < Number.MAX_VALUE - 1) {
        return highestZIndexFound;
    }
    else {
        throw ("Maximum Zindex number reached");
    }
}
/**
 * manages the appearance/disappearance of the zoomed image and the background
 * @param referenceImage
 */
function imageZoomLogic(referenceImage) {
    /**
     * Calculates the style for the zoomed image
     *  also takes care of positioning the photo on the screen
     * @param image
     */
    function applyCalCStyle(image) {
        var AVAILABLE_WIDTH = window.innerWidth;
        var AVAILABLE_HEIGHT = window.innerHeight;
        var IMAGE_WIDTH = image.width;
        var IMAGE_HEIGHT = image.height;
        var IMAGE_RATIO = IMAGE_WIDTH / IMAGE_HEIGHT;
        var REDUCTION_COEFF = Number(manager.param("REDUCTION_COEFF"));
        if (AVAILABLE_WIDTH <= AVAILABLE_HEIGHT) {
            if (IMAGE_WIDTH < IMAGE_HEIGHT) {
                image.height = AVAILABLE_HEIGHT * REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            }
            else {
                image.width = AVAILABLE_WIDTH * REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        }
        else {
            if (IMAGE_WIDTH < IMAGE_HEIGHT) {
                image.height = AVAILABLE_HEIGHT * REDUCTION_COEFF;
                image.width = image.height * IMAGE_RATIO;
            }
            else {
                image.width = AVAILABLE_WIDTH * REDUCTION_COEFF;
                image.height = image.width / IMAGE_RATIO;
            }
        }
        image.style.top = (AVAILABLE_HEIGHT - image.height) / 2 + "px";
        image.style.left = (AVAILABLE_WIDTH - image.width) / 2 + "px";
        ;
    }
    /*
    * if src is not defined or if the width is too small
    * this section will not work at all
    */
    if (referenceImage.src !== "" &&
        window.innerWidth > manager.param("MINIMUM_WIDTH")) {
        overlay(true);
        var newImage_1 = document.createElement("img");
        newImage_1.style.position = "fixed";
        newImage_1.width = referenceImage.width;
        newImage_1.height = referenceImage.height;
        try {
            newImage_1.style.zIndex = String(findHighestZIndex() + 1);
        }
        catch (e) {
            newImage_1.style.zIndex = "1000";
        }
        applyCalCStyle(newImage_1);
        newImage_1.src = referenceImage.src;
        document.body.appendChild(newImage_1);
        /**
        * readjusts the style of the enlarged photo with the resize of the page
        */
        window.addEventListener("resize", function () {
            applyCalCStyle(newImage_1);
        });
        //if the user clicks anywhere on the screen, closes the view
        var overlayElem = document.getElementById(manager.currentID());
        newImage_1.addEventListener("click", function () {
            overlay(false);
            window.removeEventListener("resize", function () {
                applyCalCStyle(newImage_1);
            });
            //this also removes the event listener
            document.body.removeChild(newImage_1);
        });
        overlayElem.addEventListener("click", function () {
            overlay(false);
            window.removeEventListener("resize", function () {
                applyCalCStyle(newImage_1);
            });
            document.body.removeChild(newImage_1);
        });
    }
}
window.addEventListener('DOMContentLoaded', function () {
    /**
     * Puts a listener for each image with the class specified in CONFIGURATION_PARAMS
     */
    function loadListeners() {
        var classToUse = String(manager.param("CLASS_FOR_IMAGES"));
        var imagesToZoom = document.getElementsByClassName(classToUse);
        var _loop_1 = function (i) {
            imagesToZoom[i].addEventListener("click", function () {
                imageZoomLogic(imagesToZoom[i]);
            });
        };
        for (var i = 0; i < imagesToZoom.length; i++) {
            _loop_1(i);
        }
    }
    var secondsDelay = manager.param("SECONDS_DELAY_FOR_LISTENERS");
    if (typeof (secondsDelay) === "number" &&
        secondsDelay > 0) {
        setTimeout(loadListeners, secondsDelay * 1000);
    }
    else {
        loadListeners();
    }
});
