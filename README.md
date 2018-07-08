# skylighting-Web-app
My thesis code for AUEB (Athen University of Economics and Business - Computer Science Program)

## Abstract

In this thesis we study and briefly examine different skylight models that have been proposed by the scientific community and we analyze a more recent one which provides an analytic model for full-Spectral Sky-Dome Radiance. This model is used to implement a web-based application which takes input from the user and draws a scene on a canvas element using the JavaScript 3D library three.js. This scene includes a basic 3D-model, a ground plane, the sky Dome, the Sun and the light sources that represent the radiance of the sky. A full explanation is provided for the source code and the functionality of each component of the Web-application as well as some screenshots of the scene, showing different instances of the sky dome and the 3D-model while changing the turbidity, the ground albedo value as well as the solar elevation.

## How to run
The following installation is based on the web-server Apache 2.4.18 and PHP 7.0.30.

- Copy the *skymodel* directory to */var/www/html*
- Create the **dome_points** executable by running inside the *dome_points* directory:
```
gcc -std=c99 dome_points.c ArHosekSkyModel.c -o dome_points -lm
cp dome_points /var/www/html/skymodel/
```
- Go to http://localhost/skymodel/skydome.html.

### Notes
- The Demo function re-draws the scene every second (bad practice :) and since the loading of some 3d models takes more than 4 secs (the dinosaur for example), you will see nothing more than black screen on these occasions (more info on the document). 
- The code the loads the models and the ground material is very old and sometimes it doesn't show what is expected to, after I upgraded the three.js library to the 94 version.
