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

let chart1, chart2, chart3, chart4;
let selectedRegionColor = "#a4a2a2";
let selectedMetric = "Earnings_USD";
let selectedRegion = null;



function initDashboard(_data) {


    //  SVG container
    chart1 = d3.select("#chart1").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    //  SVG container
    chart2 = d3.select("#chart2").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    //  SVG container
    chart3 = d3.select("#chart3").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    //  SVG container
    chart4 = d3.select("#chart4").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    createChart1();
    createChart3();
    createChart4();

      // Dropdown options for Chart 2
const yOptions = ["Earnings_USD", "Hourly_Rate", "Job_Success_Rate"];
const ySelect = d3.select("#chart2YSelect");
ySelect.selectAll("option")
  .data(yOptions)
  .enter()
  .append("option")
  .attr("value", d => d)
  .text(d => d.replace(/_/g, " "));

// Explicitly set default value to match first render
ySelect.property("value", "Earnings_USD");

// Initial chart 2 render
createChart2("Earnings_USD");

// Change handler
ySelect.on("change", function () {
const selectedMetric = d3.select("#chart2YSelect").property("value");
  if (selectedRegion) {
    createChart2(selectedMetric, selectedRegion, selectedRegionColor);
  } else {
    createChart2(selectedMetric);
  }
});





    // Dropdown options for Chart 3
    const xOptionsChart3 = ["Experience_Level", "Client_Region", "Job_Category"];
const yOptionsChart3 = ["Earnings_USD", "Hourly_Rate", "Job_Success_Rate"];

d3.select("#chart3XSelect").selectAll("option")
  .data(xOptionsChart3).enter().append("option")
  .attr("value", d => d).text(d => d.replace(/_/g, " "));

d3.select("#chart3YSelect").selectAll("option")
  .data(yOptionsChart3).enter().append("option")
  .attr("value", d => d).text(d => d.replace(/_/g, " "));

d3.selectAll("#chart3XSelect, #chart3YSelect").on("change", () => {
  const xAttr = d3.select("#chart3XSelect").property("value");
  const yAttr = d3.select("#chart3YSelect").property("value");
  createChart3(xAttr, yAttr);
});

// options for Chart 4
const binSlider = d3.select("#binSlider");
const binCountText = d3.select("#binCount");

binSlider.on("input", function() {
  const bins = +this.value;
  binCountText.text(bins);
  createChart4(bins);
});

  d3.select("#chart2")
    .append("div")
    .attr("id", "regionLegendContainer")
    .style("margin-top", "10px")
    .style("text-align", "center");

}


function createChart1() {
  chart1.selectAll("*").remove();

  if (!currentData || currentData.length === 0) return;

  const radius = Math.min(width, height) / 2 - 50;
  const g = chart1.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const nestedData = d3.group(currentData, d => d.Client_Region, d => d.Job_Category);

  function buildHierarchy(groupedData) {
  const root = { name: "root", children: [] };
  for (const [region, categories] of groupedData.entries()) {
    const regionNode = { name: region, children: [] };
    for (const [category, records] of categories.entries()) {
      const totalJobs = d3.sum(records, r => r.Job_Completed);
      regionNode.children.push({ name: category, value: totalJobs });
    }
    root.children.push(regionNode);
  }
  return root;
}


  const rootData = buildHierarchy(nestedData);
  const root = d3.hierarchy(rootData).sum(d => d.value);

  d3.partition().size([2 * Math.PI, radius])(root);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

  const regions = [...new Set(currentData.map(d => d.Client_Region))];
  const regionColor = d3.scaleOrdinal().domain(regions).range(d3.schemeTableau10);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const categoryColorMap = new Map();
  for (const region of regions) {
    const base = d3.color(regionColor(region));
    const interpolator = d3.interpolateRgb("white", base);
    categoryColorMap.set(region, interpolator);
  }

  const regionCategoryCount = new Map();
  root.children.forEach(regionNode => {
    regionCategoryCount.set(regionNode.data.name, regionNode.children.length);
  });

  // Draw arcs
  g.selectAll("path")
    .data(root.descendants().filter(d => d.depth))
    .enter().append("path")
    .attr("d", arc)
    .style("fill", d => {
      if (d.depth === 1) return regionColor(d.data.name);
      if (d.depth === 2) {
        const region = d.parent.data.name;
        const index = d.parent.children.findIndex(c => c === d);
        const total = regionCategoryCount.get(region);
        return categoryColorMap.get(region)((index + 1) / total);
      }
      return "#ccc";
    })
    .style("stroke", d => d.depth === 2 ? regionColor(d.parent.data.name) : "none")
    .style("stroke-width", d => d.depth === 2 ? "1px" : "0px")
   .on("mouseover", function (event, d) {
  d3.select(this).style("opacity", 0.7);
  tooltip.transition().duration(200).style("opacity", 0.9);

  const pathNames = d.ancestors()
    .map(d => d.data.name)
    .reverse()
    .filter(name => name !== "root");  

  tooltip.html(`${pathNames.join(" → ")}<br>Value: ${d.value}`)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px");
})

    .on("mouseout", function() {
      d3.select(this).style("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    })
.on("click", function(event, d) {
  if (d.depth === 1) {
    selectedRegion = d.data.name;
    selectedRegionColor = regionColor(d.data.name); 
    const selectedMetric = d3.select("#chart2YSelect").property("value");
    createChart2(selectedMetric, selectedRegion, selectedRegionColor);
    drawRegionLegend(selectedRegion);
  }
});




  // Region labels
  g.selectAll("text.region-label")
    .data(root.descendants().filter(d => d.depth === 1))
    .enter().append("text")
    .attr("class", "region-label")
    .attr("transform", d => {
      const angle = (d.x0 + d.x1) / 2;
      const radiusMid = (d.y0 + d.y1) / 2;
      const x = Math.sin(angle) * radiusMid;
      const y = -Math.cos(angle) * radiusMid;
      return `translate(${x},${y})`;
    })
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .text(d => d.data.name);

  // Category labels rotated
  g.selectAll("text.category-label")
    .data(root.descendants().filter(d => d.depth === 2))
    .enter().append("text")
    .attr("class", "category-label")
    .attr("transform", d => {
      const angle = ((d.x0 + d.x1) / 2) * 180 / Math.PI - 90;
      const r = (d.y0 + d.y1) / 2;
      const x = Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * r;
      const y = Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * r;
      return `translate(${x},${y}) rotate(${angle})`;
    })
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("font-size", "7px")
    .attr("fill", "#000")
    .text(d => d.data.name);
}






function createChart2(metric, regionFilter = null, lineColor = "#a4a2a2"){
  chart2.selectAll("*").remove();

  const margin = { top: 20, right: 20, bottom: 80, left: 60 },
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

  const g = chart2.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const filteredData = regionFilter
    ? currentData.filter(d => d.Client_Region === regionFilter)
    : currentData;

  const binned = d3.rollups(
    filteredData.filter(d => !isNaN(+d.Job_Duration_Days) && !isNaN(+d[metric])),
    v => d3.mean(v, d => +d[metric]),
    d => {
      const day = +d.Job_Duration_Days;
      const binStart = Math.floor(day / 5) * 5;
      return `${binStart}-${binStart + 4}`;
    }
  ).map(([bin, avgValue]) => ({ bin, avgValue }));

  binned.sort((a, b) => parseInt(a.bin) - parseInt(b.bin));

  const x = d3.scalePoint()
    .domain(binned.map(d => d.bin))
    .range([0, innerWidth])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([
      d3.min(binned, d => d.avgValue),
      d3.max(binned, d => d.avgValue)
    ])
    .nice()
    .range([innerHeight, 0]);

  const linePath = g.append("path")
    .datum(binned)
    .attr("fill", "none")
.attr("stroke", lineColor)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 2")
    .attr("d", d3.line()
      .x(d => x(d.bin))
      .y(d => y(d.avgValue)));

  const totalLength = linePath.node().getTotalLength();
  linePath
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

  g.append("g").call(d3.axisLeft(y).tickSize(-innerWidth).tickPadding(10));

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x)
      .tickValues(x.domain().filter((d, i) => i % 2 === 0)))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 25)
    .style("text-anchor", "middle")
  .style("font-weight", "bold")
  .style("font-size", "14px")
    .text("Job Duration Bins (Days)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
      .style("font-size", "14px")
    .text(metric.replace(/_/g, " "));

  updateRegionLegend(regionFilter);
}

function updateRegionLegend(region) {
  const container = d3.select("#regionLegendContainer");
  container.selectAll("*").remove();

  if (region) {
    container.append("span")
      .style("padding", "6px 12px")
      .style("background", "#eee")
      .style("border", "1px solid #ccc")
      .style("cursor", "pointer")
      .text("Region: " + region)
.on("click", () => {
  selectedRegion = null;
  selectedRegionColor = "#a4a2a2"; 
  const metric = d3.select("#chart2YSelect").property("value");
  createChart2(metric);
});

  }
}


function createChart3(xAttr = "Experience_Level", yAttr = "Earnings_USD") {
  chart3.selectAll("*").remove();

  const margin = { top: 20, right: 150, bottom: 100, left: 60 },
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

  const g = chart3.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xValues = [...new Set(currentData.map(d => d[xAttr]?.toString().trim()))];

  const grouped = xValues.map(xVal => {
    const values = currentData
      .filter(d => d[xAttr]?.toString().trim() === xVal)
      .map(d => +d[yAttr])
      .filter(v => !isNaN(v))
      .sort(d3.ascending);

    if (values.length === 0) return { xVal, q1: 0, median: 0, q3: 0, min: 0, max: 0 };

    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerWhisker = values.find(v => v >= q1 - 1.5 * iqr);
    const upperWhisker = values.reverse().find(v => v <= q3 + 1.5 * iqr);

    return {
      xVal, q1, median, q3,
      min: lowerWhisker,
      max: upperWhisker
    };
  });

  const x = d3.scalePoint()
    .domain(xValues)
    .range([0, innerWidth])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([
      d3.min(grouped, d => d.min),
      d3.max(grouped, d => d.max)
    ])
    .nice()
    .range([innerHeight, 0]);

  // Whiskers
  g.selectAll("line.stem")
    .data(grouped)
    .enter().append("line")
    .attr("class", "stem")
    .attr("x1", d => x(d.xVal))
    .attr("x2", d => x(d.xVal))
    .attr("y1", d => y(d.min))
    .attr("y2", d => y(d.max))
    .attr("stroke", "black");

  // Boxes
  g.selectAll("rect.box")
    .data(grouped)
    .enter().append("rect")
    .attr("class", "box")
    .attr("x", d => x(d.xVal) - 20)
    .attr("y", d => y(d.q3))
    .attr("width", 40)
    .attr("height", d => y(d.q1) - y(d.q3))
    .attr("fill", "#d3d3d3")
    .attr("opacity", 0.5);

    // Median lines
  g.selectAll("line.median")
    .data(grouped)
    .enter().append("line")
    .attr("class", "median")
    .attr("x1", d => x(d.xVal) - 20)
    .attr("x2", d => x(d.xVal) + 20)
    .attr("y1", d => y(d.median))
    .attr("y2", d => y(d.median))
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  // Axes
  g.append("g").call(d3.axisLeft(y));
const xAxis = g.append("g")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(d3.axisBottom(x));

xAxis.selectAll("text")
  .attr("transform", "rotate(-40)")
  .style("text-anchor", "end")
  .style("font-size", "12px")
  .attr("dx", "-0.5em")
  .attr("dy", "0.5em");

g.append("text")
  .attr("class", "x-axis-label")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight + 90) 
  .style("text-anchor", "middle")
  .style("font-weight", "bold")
  .style("font-size", "14px")
  .text(xAttr.replace(/_/g, " "));




  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
      .style("font-size", "14px")
    .text(yAttr.replace(/_/g, " "));
}







function createChart4(binNumber = 20) {
  chart4.selectAll("*").remove();

  const margin = {top: 20, right: 20, bottom: 60, left: 60},
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

  const g = chart4.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const earnings = currentData.map(d => +d.Earnings_USD).filter(e => !isNaN(e));

  const x = d3.scaleLinear()
    .domain(d3.extent(earnings)).nice()
    .range([0, innerWidth]);

  const histogram = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(binNumber));

const earningsWithJobs = currentData
  .filter(d => !isNaN(+d.Earnings_USD) && !isNaN(+d.Job_Completed))
  .map(d => ({ earnings: +d.Earnings_USD, jobs: +d.Job_Completed }));

const bins = histogram(earningsWithJobs.map(d => d.earnings)).map((bin, i) => {
  const binJobs = earningsWithJobs.filter(d => d.earnings >= bin.x0 && d.earnings < bin.x1);
  const completed = d3.sum(binJobs, d => d.jobs);
  return Object.assign(bin, { completed });
});

  const y = d3.scaleLinear()
.domain([0, d3.max(bins, d => d.completed)])
    .range([innerHeight, 0]);

  // Define SVG shadow filter
  const defs = chart4.append("defs");
  const shadow = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "130%");
  shadow.append("feDropShadow")
    .attr("dx", 1)
    .attr("dy", 2)
    .attr("stdDeviation", 2)
    .attr("flood-color", "#333")
    .attr("flood-opacity", 0.4);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const bars = g.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", innerHeight)
    .attr("width", d => Math.max(x(d.x1) - x(d.x0) - 1, 0))
    .attr("height", 0)
    .style("fill", "#444")
    .style("filter", "url(#drop-shadow)")
    .style("opacity", 0.9)
    .on("mouseover", function(event, d) {
      d3.select(this).style("fill", "#888");
      tooltip.transition().duration(200).style("opacity", 0.9);
     tooltip.html(`<strong>Range:</strong> ${Math.round(d.x0)} - ${Math.round(d.x1)}<br>
              <strong>Completed Jobs:</strong> ${d.completed}`)

        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("fill", "#444");
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Animate bars
  bars.transition()
    .duration(800)
    .attr("y", d => y(d.completed))
.attr("height", d => innerHeight - y(d.completed))


  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 10)
    .style("text-anchor", "middle")
      .style("font-weight", "bold")
  .style("font-size", "14px")
    .text("Average Earnings");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
      .style("font-size", "14px")
    .text("Count");
}




function clearDashboard() {

    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}