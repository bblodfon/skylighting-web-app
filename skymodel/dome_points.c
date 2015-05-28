#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "ArHosekSkyModel.h"
#define num_channels 3 		// RGB
#define R 			1000 	// sky dome's radius
#define step_phi	5		// angle for finding the next point in the phi of the sphere coordinates (must be divided by 360 exactly - use 10|20|40 for example)
#define step_theta	5		// angle for finding the next point in the theta of the sphere coordinates

#ifndef MATH_PI
#define MATH_PI		3.141592653589793
#endif
#ifndef MATH_DEG_TO_RAD
#define MATH_DEG_TO_RAD             ( MATH_PI / 180.0 )
#endif
// use the below to change degrees to radians
#ifndef DEGREES
#define DEGREES                     * MATH_DEG_TO_RAD
#endif

/* 	THE XYZ-OpenGL coordinate system:
	(also the system of the dome points)
		Y
		/\
		||
		||
		/--------->  X
       /
	  /
	 \/ 
	 Z
*/
	 
typedef struct point {
    double x;
    double y;
	double z;
} dome_point;

typedef struct chroma {
	double red;
	double green;
	double blue;
} color_point;

// calculates the next point in the dome:
// mode = 1: (-x)(y)(z=0) plane, going "up" angle degrees (angle is theta)
// mode = 2: y=constant, find the next point in the disk parallel (angle is phi)
dome_point next_point_cal(dome_point ref_point, double angle, double new_radius, int mode) {
    double ref_y = ref_point.y;
	dome_point next_point;
	if (mode == 1) {
		next_point.x = (-1) * R * cos(angle DEGREES);
		next_point.y = R * sin(angle DEGREES);
		next_point.z = 0;
	} else { // mode == 2
		next_point.x = (-1) * new_radius * cos(angle DEGREES);
		next_point.y = ref_y;
		next_point.z = new_radius * sin(angle DEGREES);
	}
	return next_point;
}

double get_gamma(dome_point solar_point, dome_point any_point){
	double angle = 0; //use formula: cos(gamma) = a*b/|a|*|b|, a,b are 3d vectors
	// take the coordinates of the vectors
	double sx = solar_point.x;
	double sy = solar_point.y;
	double sz = solar_point.z;
	double ax = any_point.x;
	double ay = any_point.y;
	double az = any_point.z;
	// do the calculations
	double product = sx * ax + sy * ay + sz * az;
	double solar_point_magnitude = sqrt (sx * sx + sy * sy + sz * sz);
	double any_point_magnitude = sqrt (ax * ax + ay * ay + az * az);
	double cos_gamma = product / (solar_point_magnitude * any_point_magnitude);
	
	return acos(cos_gamma) * 180.0 / MATH_PI;
}

void print_points_and_colors(dome_point *dome_points, color_point *color_points, int num_points){
	int j;
	for (j=0; j<num_points; j++){
		printf("%lf,%lf,%lf,%lf,%lf,%lf,\n",dome_points[j].x,dome_points[j].y,dome_points[j].z,color_points[j].red,color_points[j].green,color_points[j].blue);
	}
}

void print_points(dome_point *dome_points, int num_points){
	int j;
	for (j=0; j<num_points; j++){
		printf("%lf,%lf,%lf,\n",dome_points[j].x,dome_points[j].y,dome_points[j].z);
	}
}

void print_colors(color_point *color_points, int num_points, int islast){
	int j;
	for (j=0; j<num_points; j++){
		if ((j == num_points - 1) && (islast)) { // tha last light colors with no extra comma!
			printf("%lf,%lf,%lf\n",color_points[j].red,color_points[j].green,color_points[j].blue);
			break;
		}
		printf("%lf,%lf,%lf,\n",color_points[j].red,color_points[j].green,color_points[j].blue);
	}
}

void print_values_with_commas(int a, int b, int c){
	printf("%d,%d,%d,\n",a,b,c);
}

void print_triangle_faces(int last_disk, int last_point, int npp){ //npp = number_points_phi
	int i, disk = 0, k;
	for (i=0; i != last_point; i++){
		if (i % npp == 0) disk++;
		k = -100;
		if ((i+1) % npp == 0) k = (i+1)-npp;
		
		if (disk == 1) {
			if (k == -100) print_values_with_commas(i,i+1,npp+i);
			else print_values_with_commas(i,k,npp+i);
			continue;
		}
		
		if (disk == last_disk){
			if (k == -100){
				print_values_with_commas(i,i+1,(i+1)-npp);
				print_values_with_commas(i,i+1,last_point);
			} else {
				print_values_with_commas(i,k,k-npp);
				print_values_with_commas(i,k,last_point);
			}
		} else { //disk = 2,3,...,last_disk-1
			//printf("k:%d\n",k);
			if (k == -100){
				print_values_with_commas(i,i+1,(i+1)-npp);
				print_values_with_commas(i,i+1,npp+i);
			} else {
				print_values_with_commas(i,k,k-npp);
				print_values_with_commas(i,k,npp+i);
			}
		}
	}
}


int main (int argc, char *argv[]){

    if (argc != 4) {
        printf("Usage: dome_points.exe turbitidy_value solarElevation_value albedo_value\n");
        return 0;
    }
	// take the input for the ArHosekSkyModel
	double turbidity = atof(argv[1]); //double turbidity = (1-10) if you want solar_radiance too (search assert in ArHosekSkyModel.c)
    double solarElevationDeg = atof(argv[2]);
    double solarElevationRad = solarElevationDeg DEGREES; // in radians for the ArHosekSkyModel
	double albedo[num_channels]; // [0-1]
	for ( unsigned int i = 0; i < num_channels; i++ ){
        albedo[i] = atof(argv[3]);
    }
	double angle_theta,angle_gamma; // the angles used in the ArHosekSkyModel
	int j,phi,theta;
	int num_points_phi = 360/step_phi;
	int num_disks_parallels = (80/step_theta) + 1;
	int num_points = ( num_points_phi * num_disks_parallels ) + 1;
	
	//printf("R=%d step_phi=%d step_theta=%d num_points=%d num_points_phi=%d num_disks_parallels=%d\n",R,step_phi,step_theta,num_points,num_points_phi,num_disks_parallels);
	
	// initialize dome points coordinates struct and first reference point
	dome_point *dome_points = (dome_point *) malloc(num_points * sizeof(dome_point));
	dome_points[0].x = -R;
	dome_points[0].y = 0;
	dome_points[0].z = 0;
	dome_point ref_point = dome_points[0];
	
	// calculate the solar point coordinates
	dome_point solar_point;
	solar_point = next_point_cal(dome_points[0],solarElevationDeg,R,1);
	//printf("Solar elevation: %lf\nx:%lf,y:%lf,z:%lf\n",solarElevationDeg,solar_point.x,solar_point.y,solar_point.z);
	
	// initialize the colors of the dome points
	color_point *color_points = (color_point *) malloc(num_points * sizeof(color_point));
	double redCenterWavelength = 685.0;
	double greenCenterWavelength = 533.0;
	double blueCenterWavelength = 473.0;
	ArHosekSkyModelState *skymodel_state[num_channels];
    for ( unsigned int i = 0; i < num_channels; i++ ){
        skymodel_state[i] = arhosekskymodelstate_alloc_init(solarElevationRad,turbidity,albedo[i]);
    }
	// color for the first point
	angle_theta = 90;
	angle_gamma = get_gamma(solar_point,dome_points[0]);
	// careful: angle_theta and angle_gamma must be in radians!
	color_points[0].red   = arhosekskymodel_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength);
	color_points[0].green = arhosekskymodel_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength);
	color_points[0].blue  = arhosekskymodel_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength);
	
	// calculate the (x,y,z) coordinates and colors (R,G,B) of the dome points
	phi = 0;
	theta = 0;
	double new_radius = R;
	for (j=1; j<num_points-1; j++) {
		if (j % num_points_phi == 0) { // new disk parallel
			theta += step_theta;
			angle_theta = 90 - theta; // its the "reverse" angle we need for the ArHosekSkyModel
			phi = 0;
			dome_points[j] = next_point_cal(dome_points[0],theta,new_radius,1);
			angle_gamma = get_gamma(solar_point,dome_points[j]);
			ref_point = dome_points[j];
			new_radius = abs (ref_point.x);
			//printf("new_radius: %lf, angle_theta: %lf\n",new_radius,angle_theta);
		} else {
			phi += step_phi; //(angle_)theta doesn't change in the "parallel" disks
			dome_points[j] = next_point_cal(ref_point,phi,new_radius,2);
			angle_gamma = get_gamma(solar_point,dome_points[j]);
		}
		color_points[j].red   = arhosekskymodel_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength);
		color_points[j].green = arhosekskymodel_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength);
		color_points[j].blue  = arhosekskymodel_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength);
	}
	// and the zenith coordinates and colors:
	dome_points[num_points-1].x = 0;
	dome_points[num_points-1].y = R;
	dome_points[num_points-1].z = 0;
	angle_theta = 0;
	angle_gamma = get_gamma(solar_point,dome_points[num_points-1]); // 90-solarElevationDeg actually!
	color_points[num_points-1].red   = arhosekskymodel_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength);
	color_points[num_points-1].green = arhosekskymodel_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength);
	color_points[num_points-1].blue  = arhosekskymodel_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength);
	
	// number of total points + colors: print_points_and_colors(dome_points,color_points,num_points);
	// print number of total coordinate points:
	printf("%d,", num_points * 3);
	print_points(dome_points,num_points);
	int islast = 0;
	print_colors(color_points,num_points,islast);
	
	// number of points of triangles on the dome:
	printf("%d,",3 * (num_points_phi + 2 * num_points_phi * (num_disks_parallels-1)) );
	print_triangle_faces(num_disks_parallels,num_points-1,num_points_phi);
	
	/* * * * * * * * * * * * * * * * * * * * */
	// Calculate (x,y,z) coordinates of the light sources as well as each 'RGB color' from the ArHosekSkyModel
	// including the illumination from the sun
	// The position of the light sources are one in the zenith and four symmetrically on the dome (90 degrees apart) at 35 degrees elevation. 
	int num_light_sources = 5;
	int num_points_light_sources = num_light_sources * 3;
	int elev_angle = 35;
	int phi_light_angle = 90;
	int add_angle = 0;
	double domeLightRatio = (2 * MATH_PI) / num_light_sources;
	dome_point *light_points = (dome_point *) malloc(num_light_sources * sizeof(dome_point));
	color_point *color_lights = (color_point *) malloc(num_light_sources * sizeof(color_point));
	
	// calculate positions of the lights
	light_points[0] = next_point_cal(dome_points[0],elev_angle,R,1);
	double radius = abs (light_points[0].x);
	for (j = 1; j < num_light_sources - 1; j++) {
		add_angle += phi_light_angle;
		light_points[j] = next_point_cal(light_points[0],add_angle,radius,2);
	}
	light_points[num_light_sources-1].x = 0;
	light_points[num_light_sources-1].y = R;
	light_points[num_light_sources-1].z = 0;
	
	// calculate 'colors' of light sources
	angle_theta = 90 - elev_angle;
	for (j = 0; j < num_light_sources-1; j++) {
		angle_gamma = get_gamma(solar_point,light_points[j]);
		// printf("\ngamma: %lf\n", angle_gamma);
		color_lights[j].red   = arhosekskymodel_solar_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength,num_light_sources);
		color_lights[j].green = arhosekskymodel_solar_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength,num_light_sources);
		color_lights[j].blue  = arhosekskymodel_solar_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength,num_light_sources);
	}
	// and for the zenith light source:
	angle_theta = 0;
	angle_gamma = get_gamma(solar_point,light_points[num_light_sources-1]);
	// printf("\ngamma: %lf\n", angle_gamma);
	color_lights[num_light_sources-1].red   = arhosekskymodel_solar_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength,num_light_sources);
	color_lights[num_light_sources-1].green = arhosekskymodel_solar_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength,num_light_sources);
	color_lights[num_light_sources-1].blue  = arhosekskymodel_solar_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength,num_light_sources);
	
	printf("%d,",num_points_light_sources);
	print_points(light_points,num_light_sources);
	islast = 0;
	print_colors(color_lights,num_light_sources,islast);
	
	/* * * * * * * * * * * * * * * * * * * * */
	// calculate and print the coordinates of the Sun (solar point: we have it already!) and its color
	color_point sun_colors;
	angle_theta = 90 - solarElevationDeg;
	angle_gamma = 0; // the point is the Sun itself now!
	sun_colors.red   = arhosekskymodel_solar_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength,num_light_sources) - domeLightRatio * arhosekskymodel_radiance(skymodel_state[0],angle_theta DEGREES,angle_gamma DEGREES,redCenterWavelength);
	sun_colors.green = arhosekskymodel_solar_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength,num_light_sources) - domeLightRatio * arhosekskymodel_radiance(skymodel_state[1],angle_theta DEGREES,angle_gamma DEGREES,greenCenterWavelength);
	sun_colors.blue  = arhosekskymodel_solar_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength,num_light_sources) - domeLightRatio * arhosekskymodel_radiance(skymodel_state[2],angle_theta DEGREES,angle_gamma DEGREES,blueCenterWavelength);
	
	printf("%lf,%lf,%lf,\n",solar_point.x,solar_point.y,solar_point.z);
	printf("%lf,%lf,%lf\n",sun_colors.red,sun_colors.green,sun_colors.blue);
	
	for ( unsigned int i = 0; i < num_channels; i++ ) {
        arhosekskymodelstate_free(skymodel_state[i]);
    }
	
	return 0;
	
}