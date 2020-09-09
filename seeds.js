var mongoose = require("mongoose");
var Campground = require("./models/campground.js");

function seedDB(){
	Campground.deleteMany({}, function(err){
		if(err){
			console.log(err);
		}else{
			console.log("Campgrounds deleted");
		}
	});
}

module.exports = seedDB; 