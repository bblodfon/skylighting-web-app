# skylighting-Web-app
My thesis code for AUEB (Athen University of Economics and Business - Computer Science Program)

<b>Abstract</b>

In this thesis we study and briefly examine different skylight models that have been proposed by the scientific community and we analyze a more recent one which provides an analytic model for full-Spectral Sky-Dome Radiance. This model is used to implement a web-based application which takes input from the user and draws a scene on a canvas element using the JavaScript 3D library three.js. This scene includes a basic 3D-model, a ground plane, the sky Dome, the Sun and the light sources that represent the radiance of the sky. A full explanation is provided for the source code and the functionality of each component of the Web-application as well as some screenshots of the scene, showing different instances of the sky dome and the 3D-model while changing the turbidity, the ground albedo value as well as the solar elevation.

To run the application, just put the skymodel folder inside a web-server (e.g. inside pathToXAMPP/htdocs/ for windows, or in /var/www for Linux) and go to http://localhost/skymodel/skydome.html. In Linux you need to re-compile the dome_points source with this:

<code>gcc -std=c99 dome_points.c ArHosekSkyModel.c -o dome_points</code><br>
and change the dome.php to run it like this (Linux way): <code>./dome_points</code>

Note that the Demo function re-draws the scene every second (I know it should do just an update - but didn't have the time to implement it that way) and because the loading of some 3d models takes more than 4 secs (the dinosaur for example), you will see nothing more than black screen on these occasions (more info on the document).
