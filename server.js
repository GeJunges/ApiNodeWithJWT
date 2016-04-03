var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8081;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hi! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------

//GET http://localhost:8081/setup
app.get('/setup', function(req, res) {
    var user = new User({
        name: 'Ge Junges',
        password: '123456',
        admin: true
    });

    user.save(function(err) {
        if (err) {
            console.log(err);
        };
        console.log('User saved sucessfully');
        res.json({ success: true });
    });
});

// get an instance of the router for api routes
var apiRoutes = express.Router();

// route to authenticate a user (POST http://localhost:8081/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
    //find teh user
    User.findOne({
        name: req.body.name
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            res.json({ sucess: false, message: 'Authenticate failed. User not found.' });
        }
        else if (user) {
            //check if password matches
            if (user.password != req.body.password) {
                res.json({ sucess: false, message: 'Authenticate failed. Wrong password.' });
            }
            else {
                //if user is found and password is right
                //create a token
                var token = jwt.sign(user, config.superSecret, { expiresIn: 1440 });
                // return the information including token as JSON
                res.json({
                    success: true, message: 'Enjoi your token!', token: token
                });
            }
        }
    });
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, config.superSecret, function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            }
            else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        })
    }
    else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

// route to show a random message (GET http://localhost:8081/api/)
apiRoutes.get('/', function(req, res) {
    apires.json({ mesage: 'Welcome to the API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
})

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// 
app.listen(port);
console.log('Magic happens at http://localhost' + port);