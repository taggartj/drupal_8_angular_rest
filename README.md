# drupal_8_angular_rest
Quick start for an angular app using Drupal 8 Rest Api


This is a repo to get you up and running with angular and drupal 8 rest fast.


#The Drupal Bit
This assumes you are starting with a fresh drupal 8 (8.4.3) Standard install.
(aka choose Standard install profile so will install the "Article" content type)

##Required Modules: (contrib)
- JsonApi https://www.drupal.org/project/jsonapi
- RestUI https://www.drupal.org/project/restui (not required is a help)
## Core Modules
- rest

#What to do With this repo (the Drupal bit)

1) Move the 2 modules inside the "DrupalModule" folder (angular_clean and angular_rest_quick_start)
to /sites/modules/custom

2) login to drupal as admin and goto "Extend" - aka site.com/admin/modules 

3) find "Angular Rest Clean" and enable.

This module only exists to remove the user.settings active config.

4.a) find "Angular Rest Quick start" and enable.

This module sets up the the correct settings for 
user accounts - see admin/config/people/accounts , and adds correct permissions for accessing the rest endpoints. 

4.b) If you don't have the required modules get them via download or drush or composer 
(example composer require drupal/jsonapi , composer require drupal/restui)

5) Enable "Angular Rest Quick start" and review permissions changes. 


# What to do with the "AngularApp"

move this directory to any place on your server or just stick it in the root of my drupal install.

1) open AngularApp/js/app.js go to line 42 ish and change
`$rootScope.baceUrl = 'http://yoursite.com/';`
to where you installed drupal.

2) if you change the dir from "AngularApp"
you need to change all the templateUrls in the routeProvider

