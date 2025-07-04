/*
 * Data Visualization - Framework
 * Copyright (C) University of Passau
 *   Faculty of Computer Science and Mathematics
 *   Chair of Cognitive sensor systems
 * Maintenance:
 *   2025, Alexander Gall <alexander.gall@uni-passau.de>
 *
 * All rights reserved.
 */

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = [
  "dimension 1",
  "dimension 2",
  "dimension 3",
  "dimension 4",
  "dimension 5",
  "dimension 6",
];

let currentData = [];
let selectedStudents = [];
let colorMap = new Map(); // Track each student's assigned color
let usedColorIndices = new Set();    // track which indices are currently used

let colorScale = d3.scaleOrdinal()
  .domain(d3.range(9)) 
  .range(d3.schemeCategory10.slice(1));

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;
// Add additional variables
function init() {
  // define size of plots
  margin = { top: 20, right: 20, bottom: 20, left: 50 };
  width = 600;
  height = 500;
  radius = width / 2;
  // Start at default tab
  document.getElementById("defaultOpen").click();

  // data table
  dataTable = d3.select("#dataTable");
  // scatterplot SVG container and axes
  scatter = d3
    .select("#sp")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");
  // radar chart SVG container and axes
  radar = d3
    .select("#radar")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  // read and parse input file
  let fileInput = document.getElementById("upload");

  fileInput.addEventListener("change", function () {
    // clear existing visualizations
    clear();

    let reader = new FileReader();
    reader.onloadend = function () {
      const parsedData = d3.csvParse(reader.result);
      currentData = parsedData;

      console.log("Parsed data:", parsedData);
      // ✅ Extract numeric dimensions only (ignore labels)
      dimensions = Object.keys(parsedData[0]).filter(
        (key) => !isNaN(+parsedData[0][key])
      );

      // ✅ Call the visualization setup functions
      initVis(parsedData);
      CreateDataTable(parsedData);
      initDashboard(parsedData);
    };
    // ✅ Read the uploaded file
    reader.readAsText(fileInput.files[0]);
  });
}

function initVis(_data) {
  // Store the data globally for reuse in other charts
  currentData = _data;
  // Scales for scatterplot axes
  let y = d3
    .scaleLinear()
    .range([height - margin.bottom - margin.top, margin.top]);
  let x = d3
    .scaleLinear()
    .range([margin.left, width - margin.left - margin.right]);
  let r = d3.scaleLinear().range([0, radius]);
  // Scatterplot Axes Setup
  yAxis = scatter
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + margin.left + ")")
    .call(d3.axisLeft(y));

  yAxisLabel = yAxis
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", margin.top / 2)
    .text("x");

  xAxis = scatter
    .append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      "translate(0," + (height - margin.bottom - margin.top) + ")"
    )
    .call(d3.axisBottom(x));

  xAxisLabel = xAxis
    .append("text")
    .style("text-anchor", "middle")
    .attr("x", width - margin.right)
    .text("y");
  // Radar chart setup
  radarAxesAngle = (Math.PI * 2) / dimensions.length;
  let axisRadius = d3.scaleLinear().range([0, radius]);
  let maxAxisRadius = 0.75;
  let textRadius = 0.8;
  // Draw radar gridlines (5 concentric circles)
  for (let i = 1; i <= 5; i++) {
    let level = (i / 5) * radius * maxAxisRadius;
    radar
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", level)
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5);
  }
  // Radar axes lines
  radarAxes = radar
    .selectAll(".axis")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "axis");

  radarAxes
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", function (d, i) {
      return radarX(axisRadius(maxAxisRadius), i);
    })
    .attr("y2", function (d, i) {
      return radarY(axisRadius(maxAxisRadius), i);
    })
    .attr("class", "line")
    .style("stroke", "black");
  // Radar axis labels
  radar
    .selectAll(".axisLabel")
    .data(dimensions)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("x", function (d, i) {
      return radarX(axisRadius(textRadius), i);
    })
    .attr("y", function (d, i) {
      return radarY(axisRadius(textRadius), i);
    })
    .text((d) => d);
  // Initialize dropdown menus with numeric dimensions
  channels.forEach((c) => initMenu(c, dimensions));
  channels.forEach((c) => refreshMenu(c));
  // Render visualizations
  renderScatterplot();
  renderRadarChart();
}
// clear visualizations before loading a new file
function clear() {
  scatter.selectAll("*").remove();
  radar.selectAll("*").remove();
  dataTable.selectAll("*").remove();
}
//Create Table
function CreateDataTable(_data) {
  // Clear previous table
  dataTable.selectAll("*").remove();
  // Create table
  const table = dataTable.append("table").attr("class", "dataTableClass");
  // Create header
  const header = table.append("thead").append("tr");
  Object.keys(_data[0]).forEach((col) => {
    header.append("th").attr("class", "tableHeaderClass").text(col);
  });
  // Create body
  const rows = table
    .append("tbody")
    .selectAll("tr")
    .data(_data)
    .enter()
    .append("tr");

  rows
    .selectAll("td")
    .data((d) => Object.values(d))
    .enter()
    .append("td")
    .attr("class", "tableBodyClass")
    .text((d) => d);
  // Optional: highlight on hover
rows.selectAll("td")
  .on("mouseover", function () {
    d3.select(this).style("background-color", "#d0f0ff");
  })
  .on("mouseout", function () {
    d3.select(this).style("background-color", null);
  });
}

function renderScatterplot() {

    const xAttr = readMenu("scatterX");
  const yAttr = readMenu("scatterY");
  const sizeAttr = readMenu("size");


const xExtent = d3.extent(currentData, d => +d[xAttr]);
const yExtent = d3.extent(currentData, d => +d[yAttr]);

// Use 0 only if all data is positive — otherwise use actual min
const xMin = xExtent[0] > 0 ? 0 : xExtent[0];
const yMin = yExtent[0] > 0 ? 0 : yExtent[0];

const xScale = d3.scaleLinear()
  .domain([xMin, xExtent[1]])
  .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
  .domain([yMin, yExtent[1]])
  .range([height - margin.bottom, margin.top]);

// OPTIONAL: Clean up ticks and force zero if not included
const xTicks = xScale.ticks().includes(0)
  ? xScale.ticks()
  : [0, ...xScale.ticks()];
const yTicks = yScale.ticks().includes(0)
  ? yScale.ticks()
  : [0, ...yScale.ticks()];

xAxis
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .transition()
  .duration(500)
  .call(d3.axisBottom(xScale).tickValues(xTicks));

yAxis
  .attr("transform", `translate(${margin.left}, 0)`)
  .transition()
  .duration(500)
  .call(d3.axisLeft(yScale).tickValues(yTicks));





  const rScale = d3.scaleLinear()
    .domain(d3.extent(currentData, d => +d[sizeAttr]))
    .range([4, 12]);

  // Update and transform x-axis (bottom)
  xAxis
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .transition()
    .duration(500)
    .call(d3.axisBottom(xScale));

  // Update and transform y-axis (left)
  yAxis
    .attr("transform", `translate(${margin.left}, 0)`)
    .transition()
    .duration(500)
    .call(d3.axisLeft(yScale));

  // Update axis labels
  xAxisLabel
    .text(xAttr)
    .attr("x", width / 2)
    .attr("y", 35)
    .style("text-anchor", "middle");

  yAxisLabel
    .text(yAttr)
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle");

  // Bind and render data points
  const circles = scatter.selectAll("circle").data(currentData);

circles.enter()
  .append("circle")
  .attr("class", "dot")
  .on("mouseover", function (event, d) {
  const tooltip = d3.select("#tooltip");
  const labelKey = Object.keys(d).find(k => isNaN(+d[k])); // Get label column (e.g. name)

  tooltip
    .style("opacity", 1)
    .html(`<b>Name:</b> ${d[labelKey]}<br/>` + 
          dimensions.map(dim => `<b>${dim}:</b> ${d[dim]}`).join("<br/>"))
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px");
})
.on("mousemove", function (event) {
  d3.select("#tooltip")
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", function () {
  d3.select("#tooltip").style("opacity", 0);
})

  .on("click", function (event, d) {
    toggleSelection(d);
    renderScatterplot();
    renderRadarChart();
  })
  .merge(circles)
  .transition()
  .duration(500)
  .attr("cx", d => xScale(+d[xAttr]))
  .attr("cy", d => yScale(+d[yAttr]))
  .attr("r", d => rScale(+d[sizeAttr]))
.style("fill", d => colorMap.has(d) ? colorScale(colorMap.get(d)) : "#4477aa")
  .style("opacity", 0.7);



  circles.exit().remove();

}

function isSelected(d) {
  return selectedStudents.some(s => s === d);
}

function toggleSelection(d) {
  const index = selectedStudents.indexOf(d);

  if (index > -1) {
    const colorIndex = colorMap.get(d);
    colorMap.delete(d);
    usedColorIndices.delete(colorIndex);
    selectedStudents.splice(index, 1);
  } else if (selectedStudents.length < 10) {
    let newIndex = 0;
    while (usedColorIndices.has(newIndex) && newIndex < 10) {
      newIndex++;
    }

    if (newIndex < 10) {
      usedColorIndices.add(newIndex);
      colorMap.set(d, newIndex);
      selectedStudents.push(d);
    }
  }
}



function radarAngle(index) {
  return (Math.PI * 2 / dimensions.length) * index - Math.PI / 2;
}

function radarX(r, i) {
  return r * Math.cos(radarAngle(i));
}

function radarY(r, i) {
  return r * Math.sin(radarAngle(i));
}


function renderRadarChart() {
  radar.selectAll(".radar-line").remove();
  radar.selectAll(".radar-dot").remove();
  d3.select("#legend").selectAll("*").remove();

  if (selectedStudents.length === 0) return;

  const axisScales = {};
  dimensions.forEach(dim => {
    axisScales[dim] = d3.scaleLinear()
      .domain(d3.extent(currentData, d => +d[dim]))
      .range([0, radius * 0.75]);
  });

  const radarLine = d3.line()
    .x((d, i) => radarX(axisScales[d.dimension](d.value), d.index))
    .y((d, i) => radarY(axisScales[d.dimension](d.value), d.index))
    .curve(d3.curveLinearClosed);

  selectedStudents.forEach((student, i) => {
    const values = dimensions.map((dim, j) => ({
      dimension: dim,
      value: +student[dim],
      index: j
    }));

    // Draw radar line
    radar.append("path")
      .datum(values)
      .attr("class", "radar-line")
      .attr("d", radarLine)
      .style("stroke", colorScale(colorMap.get(student)))
      .style("stroke-width", 2)
      .style("fill", "none");

    // Draw bullets at each axis
    radar.selectAll(`.radar-dot-${i}`)
      .data(values)
      .enter()
      .append("circle")
      .attr("class", "radar-dot")
      .attr("r", 4)
      .attr("cx", d => radarX(axisScales[d.dimension](d.value), d.index))
      .attr("cy", d => radarY(axisScales[d.dimension](d.value), d.index))
      .style("fill", colorScale(colorMap.get(student)))
      .style("stroke", "black")
      .style("stroke-width", 1);
    
    // Add legend
    const legend = d3.select("#legend").append("div").style("margin", "4px");

    legend.append("span")
      .attr("class", "color-circle")
      .style("background-color", colorScale(colorMap.get(student)));

    const labelKey = Object.keys(student).find(k => isNaN(+student[k]));
    legend.append("span").text(` ${student[labelKey] || "Item " + (i + 1)}`);

legend.append("span")
  .attr("class", "close")
  .text(" x")
  .on("click", () => {
    const removed = selectedStudents.splice(i, 1)[0];
    const colorIndex = colorMap.get(removed);

    colorMap.delete(removed);           
    usedColorIndices.delete(colorIndex); 

    renderScatterplot();                
    renderRadarChart();                 
  });

  });
}




// init scatterplot select menu
function initMenu(id, entries) {
  $("select#" + id).empty();

  entries.forEach(function (d) {
    $("select#" + id).append("<option>" + d + "</option>");
  });

  $("#" + id).selectmenu({
    select: function () {
      renderScatterplot();
    },
  });
}
// refresh menu after reloading data
function refreshMenu(id) {
  $("#" + id).selectmenu("refresh");
}
// read current scatterplot parameters
function readMenu(id) {
  return $("#" + id).val();
}
// switches and displays the tabs
function openPage(pageName, elmnt, color) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }
  document.getElementById(pageName).style.display = "block";
  elmnt.style.backgroundColor = color;
}
