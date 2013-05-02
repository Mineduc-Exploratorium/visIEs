// template
define([
	'underscore',
	'backbone',
	'jquery',
	'd3',
	'sankey',
	'VistaTooltip',
	'VistaEjesXY'
	], function(_, Backbone,$, d3,d3sankey, VistaTooltip, VistaEjesXY){

	var Visualizador = Backbone.View.extend(
		/** @lends Visualizador.prototype */
		{

		/**
		* @class VistaPrincipal vista que despliega visualizacion de ingresos vs costos de carreras
		*
		* @augments Backbone.View
		* @constructs
		*
		* @param {object} options parametros de incializacion
		* @param {array} options.data arreglo con datos (cada dato es un objeto con atributos)
		* @param {d3.select()} options.svg elemento SVG utilizado como contenedor del gráfico
		* @param {Backbone.View} options.tooltip vista utilizada como tooltip
		* Visualizador Inicia parametros de configuración y llamada a datos
		*/
		initialize: function() {
			this.data = this.options && this.options.data ? this.options.data : [];

			// Binding de this (esta vista) al contexto de las funciones indicadas
			_.bindAll(this,"render", "tootipMessage")

			// Alias a this para ser utilizado en callback functions
			var self = this; 
			
			// Configuración de espacio de despliegue de contenido en pantalla
			this.margin = {top: 20, right: 20, bottom: 30, left: 20},
	    	this.width = 900 - this.margin.left - this.margin.right,
	    	this.height = 600 - this.margin.top - this.margin.bottom;

	   		this.color = d3.scale.category20c();

			// Vista con tooltip para mostrar datos del item respectivo
			this.tooltip = new VistaTooltip();
			this.tooltip.message = this.tootipMessage;

			this.color = d3.scale.category20();

			// append the svg canvas to the page
			this.svg = d3.select(this.el)
			    .attr("width", this.width + this.margin.left + this.margin.right)
			    .attr("height", this.height + this.margin.top + this.margin.bottom)
			  .append("g")
			    .attr("transform", 
			          "translate(" + this.margin.left + "," + this.margin.top + ")");


			this.render();
	 
		},

		/**
		* Reescribe función generador de mensajes utilizado en herramienta de tooltip
		* tooltip.tooltipMessage(data) 	
		*
		* @param {object} data objeto con atributos (Ej: {nombre: "Juan", Edad: 18}) utilizados en la creación del mensaje a desplegar por tooltip
		* @returns {string} Mensaje (html) a ser utilizado por tooltip
		*/
		tootipMessage : function(d) {
			var msg = "<span class='text-info'>"+d.name+"</span>";

			return msg;

		}, 

		/**
		* Despliegue inicial de elementos gráficos.
		*/
		render: function() {
			var self = this; // Auxiliar para referirse a this en funciones callback


			// Ordenar datos por tipo de acreditación
			var data = _.sortBy(this.data, function(d) {return d.ACREDITACION_CARRERA});		
			//var data = _.filter(data, function(d) {return d.TIPO_INSTITUCION == "UNIVERSIDAD ESTATAL"});	

			var nestedData = d3.nest()
			.key(function(d) { return "Chile"; })
			.key(function(d) { return d.tipo; })
			.entries(data);

			var forceNodes = []
			var forceLinks = []

			var index = 0;

			var root = nestedData[0]

			var radious = d3.scale.sqrt()
				.range([2,20])
				.domain(d3.extent(this.data, function(d) {return parseInt(d.pregrado2012)}))


			forceNodes[index] = {name:root.key, group:"Chile"}
			
			
			var tipoUniversidades = root.values
			rootIndex= index;
			_.each(tipoUniversidades, function(tipoUniv, i) {
				index++;
				forceNodes[index] = {name:tipoUniv.key, group:tipoUniv.key};
				tipoUnivIndex = index;
				forceLinks.push({source:rootIndex, target: tipoUnivIndex, value:1})
				var universidades = tipoUniv.values
				_.each(universidades, function(univ, i) {
					index++;
					univIndex = index;
					forceNodes[index] = {name: univ.nombre, group:tipoUniv.key, matricula: univ.pregrado2012};
					forceLinks.push({source:tipoUnivIndex, target: univIndex, value:1})
				})
			});


			var color = d3.scale.category20();

			var force = d3.layout.force()
			    .charge(-120)
			    .linkDistance(20)
			    .size([this.width, this.height]);


			force
			  .nodes(forceNodes)
			  .links(forceLinks)
			  .start();



			var link = this.svg.selectAll(".link")
			  .data(forceLinks)
			.enter().append("line")
			  .attr("class", "link")
			  .style("stroke-width", function(d) { return Math.sqrt(d.value); });

			var node = this.svg.selectAll(".node")
			  .data(forceNodes)
			.enter().append("circle")
			  .attr("class", "node")
			  .attr("r", function(d) {return d.matricula ? radious(d.matricula): 10})
			  .style("fill", function(d) { return color(d.group); })
			  .call(force.drag);
			  
			node.on("mouseover", function(d) {
						self.tooltip.show(d)}
						)
				.on("mouseout", function(d) {self.tooltip.hide()})

			force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
			    .attr("y1", function(d) { return d.source.y; })
			    .attr("x2", function(d) { return d.target.x; })
			    .attr("y2", function(d) { return d.target.y; });

			node.attr("cx", function(d) { return d.x; })
			    .attr("cy", function(d) { return d.y; });
			});

		}

	});
  
  return Visualizador;
});

