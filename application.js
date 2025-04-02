'use strict';

import Application from '../app-framework/base/application.js';
import Popup from '../app-framework/ui/popup.js';
import Playback from '../app-framework/widgets/playback.js';
import ServerLoader from '../app-framework/widgets/server-loader.js';
import Settings from '../app-framework/widgets/settings/settings.js';
import PopupLinker from '../app-framework/widgets/linker/popup-linker.js';
import PopupPalette from '../app-framework/widgets/palette/popup-palette.js';
import Dom from '../app-framework/tools/dom.js';
import Loader from '../app-framework/widgets/loader.js';
import wDiagram from '../app-framework/widgets/diagram/w-diagram.js'
import wGrid from '../app-framework/widgets/grid/w-grid.js'
import AppConfig from '../app-framework/components/config.js';
import Recorder from '../app-framework/components/recorder.js';
import Zip from '../app-framework/tools/zip.js';

export default class AppSimple extends Application { 

	constructor(container) {		
		super(container);
		
		this.elems.a_lab.href = AppConfig.URLs.lab;
		this.elems.a_viewer.href = AppConfig.URLs.viewer;
		this.elems.a_samples.href = AppConfig.URLs.samples;
		this.elems.a_mail.href = AppConfig.URLs.mail;
		
		Dom.add_css(document.body, "Simple");
		
		this.popups = {
			server_loader: new Popup(this.nls("Popup_SL_Title"), new ServerLoader()),
			settings: new Popup(this.nls("Popup_Settings_Title"), new Settings()),
			palette: new PopupPalette(),
			linker: new PopupLinker()
		}
		
		this.widgets = {
			loader: this.elems.loader,
			server_loader: this.popups.server_loader.widget,
			settings: this.popups.settings.widget,
			linker: this.popups.linker.widget,
			playback: this.elems.playback
		};
		
		this.elems.btnRedo.addEventListener('click', this.on_button_redo_click.bind(this));
		this.elems.btnServer.addEventListener('click', this.on_button_server_loader_click.bind(this));
		this.elems.btnSettings.addEventListener('click', this.on_button_settings_click.bind(this));
		this.elems.btnDownload.addEventListener('click', this.on_button_download_click.bind(this));
		this.elems.btnLinker.addEventListener('click', this.on_button_linker_click.bind(this));
		this.elems.btnPalette.addEventListener('click', this.on_button_palette_click.bind(this));
		
		this.widgets.loader.on("ready", this.on_upload_ready.bind(this));
		this.widgets.server_loader.on("model-selected", this.on_model_selected.bind(this));
		this.widgets.server_loader.on("files-ready", this.on_files_loaded.bind(this));
		
		this.handle_widget_errors([this.widgets.loader, this.widgets.server_loader]);
		
		this.clear();
		this.show_view("load");
	}
	
	show_view(view) {		
		this.elems.btnSettings.disabled = view == "load";
		this.elems.btnDownload.disabled = view == "load";
		this.elems.btnLinker.disabled = view != "diagram";
		this.elems.btnPalette.disabled = view != "grid";
		
		Dom.set_css(this.elems.main, `view-${view}`);
		
		if (view === "load") return;
		
		else if (view == "diagram") {			
			this.view = new wDiagram(this.elems.view, this.simulation, this.viz);
		}
		else if (view === "grid") {
			this.view = new wGrid(this.elems.view, this.simulation, this.viz);
		}
		else {
			this.handle_error(new Error("The base DEVS viewer does not support visualization type " + view));
		}
	}
	
	clear() {		
		Dom.empty(this.elems.view);
		
		this.viz = null;
		this.simulation = null;
		this.view = null;
	}
	
	on_upload_ready(ev) {
		this.clear();
		
		this.viz = ev.viz;
		this.simulation = ev.simulation;
		this.files = ev.files;
		
		this.show_view(ev.viz.type);
		
		this.widgets.playback.recorder = new Recorder(this.view.canvas);
		this.widgets.playback.initialize(this.simulation, this.viz);
		this.widgets.settings.initialize(this.viz);	
		
		if (ev.viz.type == "diagram") this.popups.linker.initialize(this.simulation, this.viz);	
		
		if (ev.viz.type == "grid") this.popups.palette.initialize(this.simulation, this.viz);
	}
	
	on_button_server_loader_click(ev) {
		this.popups.server_loader.show();
	}
	
	on_button_redo_click(ev) {	
		this.clear();
		this.show_view("load");
	}
	
	on_button_settings_click(ev) {
		this.widgets.settings.update_ui();
		this.popups.settings.show();
	}
	
	on_button_palette_click(ev) {
		this.popups.palette.show();
	}
	
	on_button_download_click(ev) {
		var files = [this.viz.to_file()];
		
		if (this.viz.type == "diagram") files.push(this.files.diagram);
		
		Zip.save_zip_stream(this.simulation.name, files);
	}
	
	async on_button_linker_click(ev) {
		await this.popups.linker.show(this.simulation, this.files.diagram);
		
		this.files.diagram = this.widgets.linker.svg_file;
	}

	on_model_selected(ev) {
		this.clear();
		this.show_view("load");
	}
	

	on_files_loaded(ev) {
		this.popups.server_loader.hide();
		this.widgets.loader.load(ev.files);
	}
	
	on_widget_error(ev) {
		alert (ev.error);
	}
		
	html() {
		return	"<main handle='main'>" +
					"<div class='header'>" +
						"<div class='header-left'>" +
							"<h1 class='first-row'><a handle='a_lab' target='_blank'>nls(Header_Lab)</a></h1>" +
							"<h2><a handle='a_viewer' target='_blank'>nls(Header_App)</a></h2>" +
						"</div>" +
						"<div class='header-right'>" +
							"<a handle='a_samples' target='_blank'>nls(Header_Sample)</a>" +
							"<a handle='a_mail' target='_blank'>nls(Header_Problem)</a>" +
						"</div>" +
					"</div>" +
				    "<div class='centered-row'>" + 
						"<div class='button-column'>" + 
						   "<button handle='btnRedo' title='nls(Application_Redo)' class='fas fa-redo'></button>" +
						   "<button handle='btnServer' title='nls(Application_Server)' class='fas fa-cloud-download-alt'></button>" +
						"</div>" +
						"<div class='body'>" + 
						   "<div handle='dropzone' class='dropzone-container'>" + 
							   "<div handle='loader' widget='Api.Widget.Loader'></div>" +
						   "</div>" +
						   "<div handle='views' class='simulation-container'>" +
							   "<div handle='view' class='simulation'></div>" +
							   "<div handle='playback' widget='Api.Widget.Playback'></div>" +
						   "</div>" +
						"</div>" +
						"<div class='button-column'>" + 
						   "<button handle='btnSettings' title='nls(Application_Settings)' class='fas fa-tools' disabled></button>" +
						   "<button handle='btnPalette' title='nls(Application_Palette)' class='fas fa-palette' disabled></button>" +
						   "<button handle='btnLinker' title='nls(Application_Linker)' class='fas fa-link' disabled></button>" +
						   "<button handle='btnDownload' title='nls(Application_Download)' class='fas fa-download' disabled></button>" +
						"</div>" +
					"</div>" +
				"</main>";
	}
	
	localize(nls) {
		super.localize(nls);
		
		nls.add("Application_Redo", "en", "Load new simulation results");
		nls.add("Application_Server", "en", "Load simulation results from server");
		nls.add("Application_Settings", "en", "Modify simulation playback settings");
		nls.add("Application_Download", "en", "Download normalized simulation files");
		nls.add("Application_Palette", "en", "Modify grid palette");
		nls.add("Application_Linker", "en", "Review links between diagram and simulation structure");
		nls.add("Popup_SL_Title", "en", "Load from server");
		nls.add("Popup_Settings_Title", "en", "Settings");
		nls.add("Header_Lab", "en", "ARSLab");
		nls.add("Header_App", "en", "DEVS Web Viewer");
		nls.add("Header_Sample", "en", "&#9733; samples");
		nls.add("Header_Problem", "en", "&#9749; report a problem");
	}
}