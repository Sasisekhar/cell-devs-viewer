import Core from "./app-framework/tools/core.js";
import Net from "./app-framework/tools/net.js";
import AppConfig from "./app-framework/components/config.js";
import Application from "./application.js";

var p1 = Core.wait_for_document();
var p2 = AppConfig.load("./application.json");

Promise.all([p1, p2]).then(Start);

function Start() {	
	var path = location.href.split("/").slice(0,-2).join("/");

	streamSaver.mitm = path + "/app-references/StreamSaver/mitm.html";
	
	var app = new Application(document.body);
}
