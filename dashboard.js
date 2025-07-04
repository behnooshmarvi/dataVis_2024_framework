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

// TODO: File for Part 2
// TODO: You can edit this file as you wish - add new methods, variables etc. or change/delete existing ones.

// TODO: use descriptive names for variables
let chart1, chart2, chart3, chart4;



function initDashboard(_data) {

    // TODO: Initialize the environment (SVG, etc.) and call the nedded methods

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

    // Initial chart 2 render
    createChart2("Earnings_USD");

    // Change handler
    ySelect.on("change", function() {
      const selectedMetric = d3.select(this).property("value");
      createChart2(selectedMetric);
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

}


function createChart1() {
  chart1.selectAll("*").remove();

  const margin = {top: 20, right: 20, bottom: 60, left: 60},
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

  const g = chart1.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const regions = [...new Set(currentData.map(d => d.Client_Region))];
  const categories = [...new Set(currentData.map(d => d.Job_Category))];

  const dataPerRegion = regions.map(region => {
    const regionData = currentData.filter(d => d.Client_Region === region);
    const counts = {};
    categories.forEach(cat => counts[cat] = regionData.filter(d => d.Job_Category === cat).length);
    return {region, ...counts};
  });

  const stack = d3.stack().keys(categories);
  const series = stack(dataPerRegion);

  const x = d3.scaleBand()
    .domain(regions)
    .range([0, innerWidth])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dataPerRegion, d => d3.sum(categories, k => d[k]))]).nice()
    .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeCategory10);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  g.selectAll("g.layer")
    .data(series)
    .enter().append("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d.data.region))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function(event, d) {
      d3.select(this).style("opacity", 0.6);

      const cat = this.parentNode.__data__.key;
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>Region:</strong> ${d.data.region}<br>
                    <strong>Category:</strong> ${cat}<br>
                    <strong>Count:</strong> ${d.data[cat]}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    });

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  // Move legend below the chart
  const legend = chart1.append("g")
    .attr("transform", `translate(${margin.left},${height - margin.bottom + 40})`);
  
  categories.forEach((cat, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(${i * 120},0)`); // horizontal spacing

    legendRow.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color(cat));

    legendRow.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text(cat);
  });
}


function createChart2(metric) {
  chart2.selectAll("*").remove();

  const margin = {top: 20, right: 20, bottom: 80, left: 60},
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

  const g = chart2.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const binned = d3.rollups(
    currentData.filter(d => !isNaN(+d.Job_Duration_Days) && !isNaN(+d[metric])),   // ✅ use metric
    v => d3.mean(v, d => +d[metric]),                                              // ✅ use metric
    d => {
      const day = +d.Job_Duration_Days;
      const binStart = Math.floor(day / 5) * 5;
      return `${binStart}-${binStart + 4}`;
    }
  ).map(([bin, avgValue]) => ({bin, avgValue}));

  binned.sort((a, b) => parseInt(a.bin.split('-')[0], 10) - parseInt(b.bin.split('-')[0], 10));

  const x = d3.scalePoint()
    .domain(binned.map(d => d.bin))
    .range([0, innerWidth])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max(binned, d => d.avgValue)]).nice()
    .range([innerHeight, 0]);

const linePath = g.append("path")
  .datum(binned)
  .attr("fill", "none")
  .attr("stroke", "#1f77b4")
  .attr("stroke-width", 2)
  .attr("d", d3.line()
    .x(d => x(d.bin))
    .y(d => y(d.avgValue)));

// Animation: draw line smoothly
const totalLength = linePath.node().getTotalLength();

linePath
  .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
  .attr("stroke-dashoffset", totalLength)
  .transition()
  .duration(2000)  // adjust duration as desired
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
    .text("Job Duration Bins (Days)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(metric.replace(/_/g, " "));
}



function createChart3(xAttr = "Experience_Level", yAttr = "Earnings_USD") {
  chart3.selectAll("*").remove();

  const margin = { top: 20, right: 150, bottom: 60, left: 60 },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const g = chart3.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Get unique categories for x-axis
  const xValues = [...new Set(currentData.map(d => d[xAttr]))];

  // Aggregate per x value
  const dataPerGroup = xValues.map(xVal => {
    const groupData = currentData.filter(d => d[xAttr] === xVal);
    return {
      xVal,
      yValue: d3.mean(groupData, d => +d[yAttr]),
      count: groupData.length
    };
  });

  // x scale
  const x = d3.scalePoint()
    .domain(xValues)
    .range([0, innerWidth])
    .padding(0.5);

  // y scale
  const yMax = d3.max(dataPerGroup, d => d.yValue);
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .nice()
    .range([innerHeight, 0]);

  // bubble size scale
  const size = d3.scaleSqrt()
    .domain([0, d3.max(dataPerGroup, d => d.count)])
    .range([10, 50]);

  // ✅ Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // ✅ Draw bubbles
  g.selectAll("circle")
    .data(dataPerGroup)
    .enter().append("circle")
    .attr("cx", d => x(d.xVal))
    .attr("cy", d => y(d.yValue))
    .attr("r", d => size(d.count))
    .attr("fill", "purple")
    .attr("opacity", 0.5)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition().duration(100)
        .attr("opacity", 0.8)
        .attr("stroke", "black")
        .attr("stroke-width", 2);

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>${xAttr}:</strong> ${d.xVal}<br>
                    <strong>Avg ${yAttr}:</strong> ${Math.round(d.yValue)}<br>
                    <strong>Count:</strong> ${d.count}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition().duration(200)
        .attr("opacity", 0.5)
        .attr("stroke", "none");
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Axes
  g.append("g").call(d3.axisLeft(y));
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  // Axis labels
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 10)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(xAttr.replace(/_/g, " "));

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
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

  const bins = histogram(earnings);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([innerHeight, 0]);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const bars = g.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", innerHeight) // start from bottom for animation
    .attr("width", d => Math.max(x(d.x1) - x(d.x0) - 1, 0)) // avoid negative widths
    .attr("height", 0) // start collapsed
    .style("fill", "#1f77b4")
    .style("opacity", 0.8)
    .on("mouseover", function(event, d) {
      d3.select(this).style("fill", "#ff7f0e");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>Range:</strong> ${Math.round(d.x0)} - ${Math.round(d.x1)}<br>
                    <strong>Count:</strong> ${d.length}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("fill", "#1f77b4");
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Animate bars growing to final height
  bars.transition()
    .duration(800)
    .attr("y", d => y(d.length))
    .attr("height", d => innerHeight - y(d.length));

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Average Earnings");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .text("Count");
}



// clear files if changes (dataset) occur
function clearDashboard() {

    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}