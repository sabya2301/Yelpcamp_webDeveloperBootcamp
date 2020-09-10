var express 			  = require("express");
var app 				  = express();
var bodyParser 			  = require('body-parser');
var mongoose 			  = require("mongoose");
var Campground 			  = require("./models/campground.js");
var seedDB 				  = require("./seeds.js");
var Comment 			  = require("./models/comment.js");
var methodOverride 		  = require("method-override");
var flash				  = require("connect-flash");

var passport 			  = require("passport"),
	LocalStrategy 		  = require("passport-local"),
	passportLocalMongoose = require("passport-local-mongoose"),
	User 				  = require("./models/user.js");


var port = process.env.PORT || 3000;
// seedDB();


mongoose.connect("mongodb://localhost:27017/yelp_camp", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false } );
mongoose.set('useUnifiedTopology', true);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Dont have a clue",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// Campground.create({
// 	name: "Souvik Ghosh", 
// 	image: "https://images.unsplash.com/photo-1532339142463-fd0a8979791a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
// 	description: "Testing comments" 
// }, function(err, campground){
// 	if(err){
// 		console.log(err);
// 	}
// 	else{
// 		console.log(campground);
// 	}
// });

// Comment.create({
// 	text: "Second Comment !",
// 	author: "Temp user"
// }, function(err, newComment){
// 	Campground.findOne({}, function(err, foundCampground){
// 		foundCampground.comments.push(newComment);
// 		foundCampground.save(function(err, data){
// 			console.log(data);
// 		})
// 	})
// });



// var campgrounds = [
// 		{name: "Sabyasachi Das", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"},
// 		{name: "Subhojit Paul", image: "https://images.unsplash.com/photo-1563299796-17596ed6b017?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"},
// 		{name: "Sourav Panja", image: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"},
// 	];

app.get("/", function(req, res){
	res.render("landing.ejs");
});


//------index page-----------------------------
app.get("/campgrounds", function(req, res){
	//get all  campgrounds from DB
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		}
		else{
		res.render("./campgrounds/campgroundsPage.ejs", {campgrounds: allCampgrounds, currentUser: req.user});
		}
	})
});


//------------------CREATE------------------------------------
app.post("/campgrounds",isLoggedIn, function(req, res){
	var name = req.body.name;
	var img = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	//var newCamp = {name:name, image:img};
	// campgrounds.push(newCamp);
	
	//create a new Campground and save it to the database
	Campground.create({
		name: name,
		image: img,
		description: description,
		author: author
	}, function(err, newCamp_ground){
		if(err){
			console.log(err);
		}
		
		else{
			// console.log("New Campground added by "+ req.user.username);
			req.flash("success", "Successfully created Campground");
			console.log(newCamp_ground);
		}
	})
	res.redirect("/campgrounds");
});


//----------- NEW ---------------------------------
app.get("/campgrounds/new", isLoggedIn, function(req, res){
	res.render("./campgrounds/newCampground.ejs");
})

//----------- SHOW --------------------------------
app.get("/campgrounds/:id", function(req, res){
	var id= req.params.id;
	
	Campground.findById(id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else{
			// console.log(foundCampground);
			res.render("./campgrounds/show.ejs", {campground: foundCampground});
		}
	})
	// var msg = "This is the details page of " + id;
	// res.send(msg);
});

// ===============
// COMMENTS ROUTES
// ===============

app.get("/campgrounds/:id/comments/new",isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log(err);
		}else{
			res.render("./comments/new.ejs", {campground: foundCampground});
		}
	})
});

app.post("/campgrounds/:id/comments",isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log(err);
		}else{
			Comment.create(req.body.comment, function(err, newComment){
				newComment.author.id = req.user._id;
				newComment.author.username = req.user.username;
				newComment.save();
				// console.log("The comment author is " + newComment.author.username);
				foundCampground.comments.push(newComment);
				foundCampground.save();
				req.flash("success", "Comment added!");
				res.redirect("/campgrounds/"+ foundCampground._id);
			})
		}
	})
});

//AUTH ROUTES
app.get("/register", function(req, res){
	res.render("register.ejs");
});

app.post("/register", function(req, res){
	//var msg = "The username is " + req.body.username +" and the password is " + req.body.password;
	//res.send(msg);
	User.register(new User({username: req.body.username}), req.body.password, function(err, newUser){
		if(err){
			console.log(err);
			return res.render("register.ejs");
		}else{
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Successfully registered!");
				res.redirect("/campgrounds");
			})
		}
	} )
});

//LOGIN ROUTES
app.get("/login", function(req, res){
	res.render("login.ejs");
});

app.post("/login", passport.authenticate("local",{
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(){});

app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged out!");
	res.redirect("/");
});

//EDIT ROUTE
app.get("/campgrounds/:id/edit",checkUserOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log(err);
		}else{
			res.render("./campgrounds/edit.ejs", {campground: foundCampground});
		}
	})
});

app.put("/campgrounds/:id",checkUserOwnership, function(req, res){
	var newCampground = {name: req.body.name, image: req.body.image, description: req.body.description}; 
	Campground.findByIdAndUpdate(req.params.id, newCampground, function(err, updatedCampground){
		if(err){
			console.log(err);
			res.redirect("/");
		}else {
			req.flash("success", "Successfully edited Campground");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DELETE ROUTE
app.delete("/campgrounds/:id",checkUserOwnership, function(req, res){
	var xid = req.params.id;
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			console.log(err);
		} else {
			req.flash("success", "Successfully Deleted");
			res.redirect("/campgrounds");
		}
	})
});

//COMMENT EDIT ROUTE
app.get("/campgrounds/:id/comments/:comment_id/edit",checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			console.log(err);
		}else{
			res.render("./comments/edit.ejs", {campground_id: req.params.id, comment: foundComment});
		}
	})
});

app.put("/campgrounds/:id/comments/:comment_id",checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
});

//COMMENT DELETE ROUTE
app.delete("/campgrounds/:id/comments/:comment_id",checkForCommentDeletion, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			console.log(err);
		}else{
			console.log("Comment deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})

//MIDDLEWARE 
// function isLoggedIn(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next;
// 	}
// 	return res.redirect("/login");
// }
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
    	// console.log(req.user);
        return next();
    }
    req.flash("error", "Please login first !");
    res.redirect("/login");
};

function checkUserOwnership(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(foundCampground.author.id.equals(req.user._id)){
				next();
			}else {
				res.redirect("back");
			}
		});
	}else {
		res.send("You need to be logged in");
	}
};

function checkCommentOwnership(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(foundComment.author.id.equals(req.user._id)){
				next();
			}else {
				res.redirect("back");
			}
		});
	}else {
		res.send("You need to be logged in");
	}
};

function checkForCommentDeletion(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err){
				console.log(err);
			}else{
				Comment.findById(req.params.comment_id, function(err, foundComment){
					if(err){
						console.log(err);
					}else{
						if(foundComment.author.id.equals(req.user.id) || foundCampground.author.id.equals(req.user.id)){
							next();
						}else{
							res.redirect("back");
						}
					}
				});
			}
		});
	}else{
		res.send("You need to be logged in");
	}
}


app.listen(port, function(){
	console.log("Yelpcamp server has started");
});


