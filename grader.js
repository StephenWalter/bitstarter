///<reference path='Definitions/node.d.ts' />

var fs = require('fs');
var util = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
//var URL_DEFAULT = "http://enigmatic-sands-9125.herokuapp.com/";
var RESULTS_FILE = "Results.json";
var TEMP_HTML_FILE = "temp.html";

var assertFileExists = function (infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function (htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var downloadHtmlFile = function (urlfile, callback) {
    var resultstr = rest.get(urlfile).on('complete', function (result) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(result.message));
        } else {
            callback(result);
        }
    });
};

var loadChecks = function (checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function (htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkUrlFile = function (urlfile, checksfile) {
    downloadHtmlFile(urlfile, function (htmlfile) {
        fs.writeFileSync(TEMP_HTML_FILE, htmlfile);
        $ = cheerioHtmlFile(TEMP_HTML_FILE);
        var checks = loadChecks(checksfile).sort();
        var out = {};
        for (var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
        var outJson = JSON.stringify(out, null, 4);
        console.log(outJson);
        fs.writeFileSync(RESULTS_FILE, outJson);
    });
};

var clone = function (fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_file>', 'URL to index.html')
        .parse(process.argv);

    if (program.url)
    {
        var checkJson = checkUrlFile(program.url, program.checks);
    }
    else
    {
        console.log("Checks: " + program.checks + " File: " + program.file);
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
        fs.writeFileSync(RESULTS_FILE, outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}