// var cat = document.getElementById("cat");

const cat = document.createElement("div");

// Set styles for the cat element
cat.style.width = "52px";
cat.style.height = "52px";
cat.style.imageRendering = "pixelated";
cat.style.cursor = "grab";
cat.style.transition = "left ease-out";
cat.style.position = "fixed";
cat.style.bottom = "0%";
cat.style.backgroundRepeat = "no-repeat"; /* Do not repeat the image */
cat.style.backgroundSize = "cover"; /* Resize the background image to cover the entire container */

var width = window.innerWidth - cat.width;
var sit = "/cat/cat_sit.png";
var walk_left = "/cat/cat_walk_left.gif";
var walk_right = "/cat/cat_walk_right.gif";


// Add cat to document
document.body.appendChild(cat);
cat.addEventListener("click", catClick);
cat.style.backgroundImage = `url(${sit})`;

// Place cat at random x position on screen
cat.style.left = Math.floor(Math.random() * width) + "px";

function catClick() {
    // Generate random position for the cat to run to
    destination = Math.floor(Math.random() * width);
    
    // Determine which direction animation to show
    if (cat.offsetLeft > destination) {
        // cat.src = "cat/cat_walk_left.gif";
        cat.src = `url(${walk_left})`;
    } else if (cat.offsetLeft < destination) {
        // cat.src = "cat/cat_walk_right.gif";
        cat.src = `url(${walk_right})`;
    }

    // Generate random time for the trip to take
    time = Math.floor(Math.random() * 4) + 2;

    // Apply the time to the cat's transition
    cat.style.transitionDuration = time+"s";

    // Set new location of cat
    cat.style.left = destination + "px";

    // Revert to sitting sprite after trip
    setTimeout(function(){
        // cat.src = "cat/cat_sit.png";
        // cat.src = `url(${sit})`;
        cat.style.backgroundImage = `url(${sit})`;
    }, time*1000);
}