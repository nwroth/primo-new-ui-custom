
# Ithaca College Library Primo UI Customizations

This repository contains the contents of Ithaca College Library's custom folder for use with the Primo discovery system from ExLibris. 

To set up a local dev environment, see [this repo](https://github.com/ExLibrisGroup/primo-explore-devenv).

Once you have the dev environment set up, you can unzip this current repo into `primo-explore/custom` and name the folder with the institutional abbreviation that you use for all things Primo.

This repo contains a number of modifications that we have made to the Primo UI, but the most noteworthy are the item-type icons (also available [here](https://github.com/dtaylor4444/PrimoIcons)) and the item location maps. You can find more explanation about the process of setting up a mapping system [here](http://rgilmour70.github.io/stackMaps/).

If you're interested in the maps, make sure your customization package includes:

* the (small) bits of `css/ic-styles.css` that pertain to the maps (starts on line 81)
* `js/sprintf.js` (you don't need to edit this)
* `js/map-data.js` (you'll need to make your own version of this file)
* the (large) bits of `ic-custom.js` that pertain to the maps (most of the file; you'll need to edit this, perhaps extensively, to reflect the needs of your library)





