var exec = require('child_process').exec;
var os = require('os');
var path = require('path');

var listeners = [],
	idle = {},
    idleSeconds = 0,
	whenToCheck;

if (/darwin/.test(process.platform)) {
    var spawn = require('child_process').spawn;
	var ls = spawn(__dirname + '/lib/idle.sh');

    ls.stdout.on('data', function(data){
		idleSeconds = parseInt(data, 10);
	});
    ls.on('close', function (code) {
        console.log('child process exited with code ' + code);
    });
}


idle.tick = function (callback) {
	callback = callback || function (){};

	if (/^win/.test(process.platform)) {
		var cmd = path.join( __dirname, 'bin', 'idle.exe');
		exec(cmd, function (error, stdout, stderr) {
			if(error) {
				throw stderr;
			}
			callback(Math.floor(parseInt(stdout, 10) / 1000))
		});
	}
	else if (/darwin/.test(process.platform)) {
		callback(idleSeconds);
	}
	else if (/linux/.test(process.platform)) {
		var cmd = 'xprintidle';
		exec(cmd, function (error, stdout, stderr) {
			if(error) {
				callback(0);
				return;
			}
			callback(Math.round(parseInt(stdout, 10) / 1000));
		});
	}
	else {
		callback(0);
	}
}

idle.addListener = function (shouldSeconds, callback) {
	var isAfk = false;

	var listenerId = listeners.push(true) - 1;
	var timeoutRef = null;

	var checkIsAway = function () {

		if(!listeners[listenerId]) {
			clearTimeout(timeoutRef);
			return;
		}

		idle.tick(function(isSeconds){
			var whenSeconds = whenToCheck(isSeconds, shouldSeconds),
				s = 1000;

			if(whenSeconds === 0 && !isAfk) {
				callback({
					status: 'away',
					seconds: isSeconds,
					id: listenerId
				});

				isAfk = true;
				timeoutRef = setTimeout(checkIsAway, s);
			}
			else if(isAfk && whenSeconds > 0) {
				callback({
					status: 'back',
					seconds: isSeconds,
					id: listenerId
				});

				isAfk = false;
				timeoutRef = setTimeout(checkIsAway, whenSeconds * s);
			}
			else if (whenSeconds > 0 && !isAfk){
				timeoutRef = setTimeout(checkIsAway, whenSeconds * s);
			}
			else {
				timeoutRef = setTimeout(checkIsAway, s);
			}
		});
	};

	checkIsAway();

	return listenerId;
};

idle.removeListener = function (listenerId) {
	listeners[listenerId] = false;
	return true;
};

whenToCheck = function (isSeconds, shouldSeconds) {
	var whenSeconds = shouldSeconds - isSeconds;
	return whenSeconds > 0 ? whenSeconds : 0;
}


module.exports = idle;
