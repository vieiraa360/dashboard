queue()
    .defer(d3.json, "/donorsUS/projects")
    .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {

    var donorsUSProjects = projectsJson;

    // Data transformation
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"];

        d["total_price_excluding_optional_support"] = +d["total_price_excluding_optional_support"];
        d["num_donors"] = +d["num_donors"];
        d["students_reached"] = +d["students_reached"];
        d.year = d["date_posted"].getFullYear();
        d.month = d["date_posted"].getMonth() +1;
    });

    // CROSSFILTER section >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    // Helper function
    function print_filter(filter){
        var f = eval(filter);
        if (typeof(f.length) != "undefined") {}else{}
        if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
        if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
        console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
    }

    // Crossfilter instance
    var ndx = crossfilter(donorsUSProjects);

    // Dimensions
    var dateDim = ndx.dimension(function (d) { return d["date_posted"]; });
    var resourceTypeDim = ndx.dimension(function (d) { return d["resource_type"]; });
    var povertyLevelDim = ndx.dimension(function (d) { return d["poverty_level"]; });
    var stateDim = ndx.dimension(function (d) { return d["school_state"]; });
    var totalDonationsDim = ndx.dimension(function (d) { return d["total_donations"]; });

    var fundingStatus = ndx.dimension(function (d) { return d["funding_status"]; });
    var areaDim = ndx.dimension(function (d) { return d["primary_focus_area"]; });
    var gradeLevelDim = ndx.dimension(function (d) { return d["grade_level"]; });
    var teacherPrefixDim = ndx.dimension(function (d) { return d["teacher_prefix"]; });
    var priceDim = ndx.dimension(function (d) { return d["total_price_excluding_optional_support"]; });
    var donorsNumDim = ndx.dimension(function (d) { return d["num_donors"]; });
    var studentsDim = ndx.dimension(function (d) { return d["students_reached"]; });
    var subjectDim = ndx.dimension(function (d) { return d["primary_focus_subject"]; });
    var metroDim = ndx.dimension(function (d) { return d["school_metro"]; });
    var yearDim = ndx.dimension(function(d) {return +d.year;});
    var monthDim = ndx.dimension(function(d) {return +d.month;});
    var forScatterDim = ndx.dimension(function (d) {return [+d.students_reached, +d.num_donors];});

    // Groups
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByFundingStatus = fundingStatus.group();
    var stateGroup = stateDim.group();

    var numProjectsByDonors = donorsNumDim.group();
    var numProjectsByMetro = metroDim.group();
    var numProjectsByArea = areaDim.group();
    var numProjectsBySubject = subjectDim.group();
    var groupForScatter = forScatterDim.group();
    var numProjectsByGradeLevel = gradeLevelDim.group();
    var numProjectsByTeacherPrefix = teacherPrefixDim.group();
    var numProjectsByPrice = priceDim.group();
    var numProjectsByStudents = studentsDim.group();

    // All
    var all = ndx.groupAll();

    // Reduce
    var totalDonationsByState = stateDim.group().reduceSum(function (d) { return d["total_donations"]; });

    var totalDonations = ndx.groupAll().reduceSum(function (d) { return d["total_donations"]; });
    var priceLayer1 = dateDim.group().reduceSum(function(d) {if (d.total_price_excluding_optional_support > 0 && d.total_price_excluding_optional_support < 500) {return d.num_donors;}else{return 0;}});
    var priceLayer2 = dateDim.group().reduceSum(function(d) {if (d.total_price_excluding_optional_support >= 500 && d.total_price_excluding_optional_support < 1000) {return d.num_donors;}else{return 0;}});
    var priceLayer3 = dateDim.group().reduceSum(function(d) {if (d.total_price_excluding_optional_support >= 1000) {return d.num_donors;}else{return 0;}});
    var totalDonors = ndx.groupAll().reduceSum(function (d) { return d["num_donors"]; });
    var totalStudents = ndx.groupAll().reduceSum(function (d) { return d["students_reached"]; });
    var totalDonationsByDate = dateDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var numberDonationsByState = stateDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsByArea = areaDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsByPovertyLevel = povertyLevelDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsByResourceType = resourceTypeDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsByGradeLevel = gradeLevelDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsByMetro = metroDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var usdProjectsBySubject = subjectDim.group().reduceSum(function (d) { return d["total_donations"]; });
    var year_total = yearDim.group().reduceSum(function(d) {return d.total_donations;});
    var totalDonationsByMonth = monthDim.group().reduceSum(function(d) {return d.total_donations;});

    // Max and Min
    var max_state = totalDonationsByState.top(1)[0].value;
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];

    var minStudents = studentsDim.bottom(1)[0]["students_reached"];
    var maxStudents = studentsDim.top(1)[0]["students_reached"];
    var minTotalDonations = totalDonationsDim.bottom(1)[0]["total_donations"];
    var maxTotalDonations = totalDonationsDim.top(1)[0]["total_donations"];
    var minDonors = donorsNumDim.bottom(1)[0]["num_donors"];
    var maxDonors = donorsNumDim.top(1)[0]["num_donors"];

    // Calculus for average donations
    var meanDonationsGroup = ndx.groupAll().reduce(
        function (p, v) {
            ++p.n;
            p.tot += v.total_donations;
            return p;
        },
        function (p, v) {
            --p.n;
            p.tot -= v.total_donations;
            return p;
        },
        function () { return {n:0,tot:0}; }
    );

    // Calculus for average donors
    var meanDonorsGroup = ndx.groupAll().reduce(
        function (p, v) {
            ++p.n;
            p.tot += v.num_donors;
            return p;
        },
        function (p, v) {
            --p.n;
            p.tot -= v.num_donors;
            return p;
        },
        function () { return {n:0,tot:0}; }
    );

    // Calculus for average students
    var meanStudentsGroup = ndx.groupAll().reduce(
        function (p, v) {
            ++p.n;
            p.tot += v.students_reached;
            return p;
        },
        function (p, v) {
            --p.n;
            p.tot -= v.students_reached;
            return p;
        },
        function () { return {n:0,tot:0}; }
    );

    // Information for titles in bubble chart
    var bubblesVars = areaDim.group().reduce(
        function (p,v) {
            ++p.count
            p.a += v.students_reached;
            p.b += v.total_donations;
            p.c += v.num_donors/p.count;
            return p;
        },
        function (p,v) {
            --p.count
            p.a -= v.students_reached;
            p.b -= v.total_donations;
            p.c -= v.num_donors/p.count;
            return p;
        },
        function () {
            return {count:0, a:0, b:0, c:0};
        }
    );

    var average = function(d) { return d.n ? d.tot / d.n : 0; };
    var expCount = function(d) { return d.n; };


    // DC and D3 section >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    // Formats for titles
    var numberFormat = d3.format(",");
    var numberFormat2 = d3.format(".3n");

    // Records counter
    /* This counter shows the amount of records selected after applying a filter. */
    dc.dataCount('.dc-data-count')
        .dimension(ndx)
        .group(all)
        .html({
        some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records',
        all: 'All records selected.'});

    // Charts variables: chart binding to HTML elements by CSS ID selectors

    // Displayed in detail.html
    var tableData = dc.dataTable("#data-table");
    var selectFieldState = dc.selectMenu('#menu-select-state');
    var selectFieldResource = dc.selectMenu('#menu-select-resource');
    var selectFieldArea = dc.selectMenu('#menu-select-area');
    var selectFieldSubject = dc.selectMenu('#menu-select-subject');
    var selectFieldPoverty = dc.selectMenu('#menu-select-poverty');
    var selectFieldFunding = dc.selectMenu('#menu-select-funding');
    var selectFieldMetro = dc.selectMenu('#menu-select-metro');
    var selectFieldTeacher = dc.selectMenu('#menu-select-teacher');

    // Displayed in main.html
    var numberProjectsND = dc.numberDisplay("#number-projects-nd");
    var totalDonationsND = dc.numberDisplay("#total-donations-nd");
    var fundingStatusChart = dc.pieChart("#funding-chart");
    var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
    var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
    var areaChart = dc.rowChart("#area-chart");
    var usdGradeChart = dc.rowChart("#usd-grade-chart");
    var teacherPrefixChart = dc.pieChart("#teacher-chart");
    var gradePieChart = dc.pieChart("#grade-chart");
    var usChart = dc.geoChoroplethChart("#us-chart");
    var stackLinesChart = dc.lineChart("#stack-lines-chart");
    var usdStateDonationsChart = dc.barChart("#usd-state-donations-chart");
    var bubbleChart  = dc.bubbleChart("#bubble-chart");
    var moveChart = dc.compositeChart("#zoom-line-chart");
    var donorsProjectsND = dc.numberDisplay("#donors-nd");
    var usdAvgDonationsND = dc.numberDisplay("#usd-avg-donations-nd");
    var avgDonorsProjectsND = dc.numberDisplay("#avg-donors-nd");
    var avgStudentsProjectsND = dc.numberDisplay("#avg-students-nd")
    var ratioNumberProjectsND = dc.numberDisplay("#ratio-donations-nd");
    var studentsProjectsND = dc.numberDisplay("#students-nd");
    var resourcePieChart = dc.pieChart("#resource-pie-chart");
    var povertyPieChart = dc.pieChart("#poverty-pie-chart");
    var areaPieChart = dc.pieChart("#area-pie-chart");
    var metroPieChart = dc.pieChart("#metro-pie-chart");
    var statesPieChart = dc.pieChart("#states-pie-chart");
    var volumeChart = dc.barChart("#volume-chart");
    var scatterChart = dc.scatterPlot("#scatter1-chart");
    var donationsMonthChart = dc.barChart("#month-chart");

    // US Map ------------------------
    /* This map shows the big picture of donation in USD by state.
     * Colours show donation amount.
     * Title info: state and its donation in USD. */
    usChart
        .width(1000)
        .height(330)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        .colorDomain([0, max_state])
        .colorCalculator(function (d) { return d ? usChart.colors()(d) : '#ccc'; })
        .overlayGeoJson(statesJson["features"], "state", function (d) { return d.properties.name; })
        .projection(d3.geo.albersUsa()
        .scale(600)
        .translate([300, 170]))
        .title(function (p) { return "State: " + p["key"] + "\n" + "$" + numberFormat(Math.round(p["value"]));});

    // Volume of donation ------------------------
    /* This chart shows the volume of donations.
     * The brush enables filter time periods. */
    volumeChart
        .width(600)
        .height(40)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .rangeChart(stackLinesChart)
        .centerBar(true)
        .gap(0)
        .elasticX(true)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .renderlet(function (chart) {
            chart.select("g.y").style("display", "none");
            moveChart.filter(chart.filter());
        });

    // Number display -----
    /* This is a summary of big figures in absolute and relative terms. */

    // Number of donations
    /* Default = all */
    numberProjectsND
        .formatNumber(d3.format(","))
        .valueAccessor(function (d) { return d; })
        .group(all);

    // Percentage of total
    /* Default = 100% */
    ratioNumberProjectsND
        .formatNumber(d3.format(",.2%"))
        .valueAccessor(function (d) { return d/20000;})
        .group(all);

    // Donations in USD
    /* Default = all */
    totalDonationsND
        .valueAccessor(function (d) { return d; })
        .group(totalDonations)
        .formatNumber(d3.format("$.3s"));

    // Average donations in USD
    /* Default = all */
    usdAvgDonationsND
        .valueAccessor(average)
        .group(meanDonationsGroup)
        .formatNumber(d3.format("$.3s"));

    // Number of students reached
    /* Default = all */
    studentsProjectsND
        .valueAccessor(function (d) { return d; })
        .group(totalStudents)
        .formatNumber(d3.format(","));

    // Average students reached
    /* Default = all */
    avgStudentsProjectsND
        .group(meanStudentsGroup)
        .valueAccessor(average)
        .formatNumber(d3.format(".3s"));

    // Number of donors
    /* Default = all */
    donorsProjectsND
        .valueAccessor(function (d) { return d; })
        .group(totalDonors)
        .formatNumber(d3.format(","));

    // Average donors
    /* Default = all */
    avgDonorsProjectsND
        .group(meanDonorsGroup)
        .valueAccessor(average)
        .formatNumber(d3.format(".3s"));

    // Line chart with zoom ------------------------
    /* This chart shows number of donations and donations in USD.
     * Title info: date and its donation in USD or/and amount. */
    moveChart
        .width(950)
        .height(200)
        .transitionDuration(1000)
        .margins({top: 30, right: 70, bottom: 25, left: 70})
        .dimension(dateDim)
        .rangeChart(volumeChart)
        .mouseZoomable(true)
        .shareTitle(false)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .legend(dc.legend().x(90).y(20).itemHeight(13).gap(5))
        .brushOn(false)
        .compose([
            dc.lineChart(moveChart)
                .group(totalDonationsByDate, "Donations in USD")
                .valueAccessor(function (d) {
                    return d.value;
                })
                .title(function (d) {
                var value = d.value;
                    if (isNaN(value)) value = 0;
                       return dateFormat(d.key) + "\n" + "$" + numberFormat(d.value);}),
            dc.lineChart(moveChart)
                .group(numProjectsByDate, "Number of donations")
                .valueAccessor(function (d) {
                    return d.value;
                })
                .title(function (d) {
                var value = d.value;
                    if (isNaN(value)) value = 0;
                       return dateFormat(d.key) + "\n" + numberFormat(d.value) + " donations";})
                .ordinalColors(["orange"])
                .useRightYAxis(true)
        ])
        .yAxisLabel("Donations in USD")
        .rightYAxisLabel("Number of donations")
        .renderHorizontalGridLines(false);

    // Pie chart funding status ------------------------
    /* This chart shows number of donations by funding status.
     * Title info: funding status, its number of donation and its percentage. */
    fundingStatusChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(fundingStatus)
        .group(numProjectsByFundingStatus)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Stack line chart ------------------------
    /* This chart shows price excluding optional support disaggregated by ranges.
     * Ranges: <$500; between $500 and <$1000; >=$1000
     * Title info: date and its number.*/
    stackLinesChart
        .width(930)
        .height(200)
        .dimension(dateDim)
        .rangeChart(moveChart)
        .mouseZoomable(false)
        .margins({top: 10, right: 50, bottom: 30, left: 70})
        .group(priceLayer1, "Price excluding optional support lower than $500")
        .stack(priceLayer2, "Price excluding optional support between $500 and $1000")
        .stack(priceLayer3, "Price excluding optional support higher $1000")
        .renderArea(true)
        .brushOn(false)
        .elasticY(true)
        .elasticX(false)
        .title(function (d) {
                    var value = d.value;
                    if (isNaN(value)) value = 0;
                       return dateFormat(d.key) + "\n" + numberFormat(d.value) + " donations";})
        .renderTitle(true)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .legend(dc.legend().x(90).y(20).itemHeight(13).gap(5))
        .yAxisLabel("Donations");

    // Pie chart teacher prefix ------------------------
    /* This chart shows number of projects classified by teacher prefix.
     * Title info: teacher prefix, its number of donation and its percentage. */
    teacherPrefixChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(teacherPrefixDim)
        .group(numProjectsByTeacherPrefix)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Row chart resource type ------------------------
    /* This chart shows donations in USD classified by resource type.
     * Title info: resource type, its donations in USD. */
    resourceTypeChart
        .width(300)
        .height(200)
        .dimension(resourceTypeDim)
        .group(usdProjectsByResourceType)
        .title(function(d) { return d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .xAxis().ticks(4);

    // Row chart poverty level ------------------------
    /* This chart shows donations in USD classified by poverty level.
     * Title info: poverty level, its donations in USD. */
    povertyLevelChart
        .width(300)
        .height(200)
        .dimension(povertyLevelDim)
        .group(usdProjectsByPovertyLevel)
        .title(function(d) { return d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .xAxis().ticks(4);

    // Row chart primary focus area ------------------------
    /* This chart shows donations in USD classified by primary focus area.
     * Title info: primary focus area, its donations in USD. */
    areaChart
        .width(300)
        .height(200)
        .dimension(areaDim)
        .group(usdProjectsByArea)
        .title(function(d) { return d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .xAxis().ticks(4);

    // Row chart grade level ------------------------
    /* This chart shows donations in USD classified by grade level.
     * Title info: grade level, its donations in USD. */
    usdGradeChart
        .width(300)
        .height(200)
        .dimension(gradeLevelDim)
        .group(usdProjectsByGradeLevel)
        .title(function(d) { return d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .xAxis().ticks(4);

    // Pie chart resource type ------------------------
    /* This chart shows number of projects classified by resource type.
     * Title info: resource type, its number of donation and its percentage. */
    resourcePieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Pie chart poverty level ------------------------
    /* This chart shows number of projects classified by poverty level.
     * Title info: poverty level, its number of donation and its percentage. */
    povertyPieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Pie chart primary focus area ------------------------
    /* This chart shows number of projects classified by primary focus area.
     * Title info: primary focus area, its number of donation and its percentage. */
    areaPieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(areaDim)
        .group(numProjectsByArea)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Pie chart grade level ------------------------
    /* This chart shows number of projects classified by grade level.
     * Title info: grade level, its number of donation and its percentage. */
    gradePieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(gradeLevelDim)
        .group(numProjectsByGradeLevel)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Bar chart donations by state ------------------------
    /* This chart shows donations in USD by state.
     * Title info: state and its donation in USD. */
    usdStateDonationsChart
        .width(1000)
        .height(200)
        .margins({top: 10, right: 50, bottom: 30, left: 70})
        .dimension(stateDim)
        .group(totalDonationsByState)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("States")
        .yAxisLabel("Donations in USD")
        .title(function(d) { return d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .yAxis().ticks(4);

    // Pie chart donation by state ------------------------
    /* This chart shows number of donations classified by state.
     * Title info: state, its donation in USD and its percentage. */
    statesPieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(stateDim)
        .group(stateGroup)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Bubble chart ------------------------
    /* This chart shows 3 variables related to primary focus area:
     * - Bubble -> Primary focus area
     * - X axis -> Students reached
     * - Y axis -> Donations in USD
     * - Bubble size -> Average donors
     * Title info: Primary focus area, students reaches, donations in USD and average donors. */
    bubbleChart
        .dimension(areaDim)
        .group(bubblesVars)
        .x(d3.scale.linear().domain([minStudents, 1500000]))
        .y(d3.scale.linear().domain([-2000000, 10000000]))
        .r(d3.scale.linear().domain([minDonors, maxDonors]))
        .elasticY(false)
        .elasticX(false)
        .width(1000)
        .height(200)
        .margins({top: 10, right: 50, bottom: 30, left: 70})
        .yAxisPadding(50)
        .xAxisPadding(50)
        .xAxisLabel('Students reached')
        .yAxisLabel('Donations in USD')
        .label(function (p) { return p.key; })
        .renderLabel(true)
        .title(function (p) {
            return [
                p.key + "\n" +
                "Students: " + numberFormat(p.value.a),
                "Donations: $" + numberFormat(p.value.b),
                "Average donors: " + numberFormat2(p.value.c),
            ]
            .join("\n");
        })
        .renderTitle(true)
        .renderHorizontalGridLines(false)
        .renderVerticalGridLines(false)
        .maxBubbleRelativeSize(0.3)
        .keyAccessor(function (p) {
            return p.value.a;
        })
        .valueAccessor(function (p) {
            return p.value.b;
        })
        .radiusValueAccessor(function (p) {
            return p.value.c;
        });

    // Pie chart metro ------------------------
    /* This chart shows number of projects classified by metro area.
     * Title info: metro area, its number of donation and its percentage. */
    metroPieChart
        .height(200)
        .radius(90)
        .innerRadius(40)
        .externalLabels(1)
        .transitionDuration(1500)
        .dimension(metroDim)
        .group(numProjectsByMetro)
        .label(function(d) { return d.key; })
        .renderLabel(true)
        .title(function(d) { return d.key + "\n" + numberFormat(d.value) + " donations" + "\n" + Math.floor(d.value / all.value() * 100) + "%"; })
        .renderTitle(true);

    // Scatter plot ------------------------
    /* This chart shows relation between number of students reached and number of donors: */
    scatterChart
        .width(650)
        .height(200)
        .x(d3.scale.linear().domain([0, 105000]))
        .y(d3.scale.linear().domain([0, 200]))
        .elasticY(false)
        .elasticX(false)
        .yAxisLabel("Donors")
        .xAxisLabel("Students reached")
        .clipPadding(10)
        .dimension(forScatterDim)
        .excludedOpacity(0.5)
        .group(groupForScatter);

    // Bar chart months ------------------------
    /* This chart shows donations in USD classified by month.
     * Title info: month, its donations in USD. */
    donationsMonthChart
        .width(650)
        .height(200)
        .margins({top: 10, right: 50, bottom: 30, left: 70})
        .dimension(monthDim)
        .group(totalDonationsByMonth)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Month")
        .yAxisLabel("Donations in USD")
        .title(function(d) { return "Month: " + d.key + "\n" +"$" + numberFormat(d.value); })
        .renderTitle(true)
        .yAxis().ticks(4);

    // Table ------------------------
    tableData
        .width(650)
        .height(800)
        .dimension(dateDim)
        .group(function(d) {return d.year;})
        .size(50)
        .columns([
            function(d) {return d.school_state;},
            function(d) {return d.resource_type;},
            function(d) {return d.poverty_level;},
            function(d) {return d.num_donors;},
            function(d) {return d.total_donations;},
            function(d) {return d.funding_status;},
            function(d) {return d.grade_level;},
            function(d) {return d.students_reached;},
            function(d) {return d.primary_focus_subject;},
            function(d) {return d.primary_focus_area;},
            function(d) {return d.school_metro;},
            function(d) {return d.teacher_prefix;}
        ])
        .sortBy(function(d){ return d.students_reached; })
        .order(d3.descending);

    // Filter
    /*These selectors filter data by:
    * - State
    * - Resource type
    * - Primary focus area
    * - Primary focus subject
    * - Poverty level
    * - Funding status
    * - Metro area
    * - teacher prefix */
    selectFieldState
        .dimension(stateDim)
        .group(stateGroup);

    selectFieldResource
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType);

    selectFieldArea
        .dimension(areaDim)
        .group(numProjectsByArea);

    selectFieldSubject
        .dimension(subjectDim)
        .group(numProjectsBySubject);

    selectFieldPoverty
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel);

    selectFieldFunding
        .dimension(fundingStatus)
        .group(numProjectsByFundingStatus);

    selectFieldMetro
        .dimension(metroDim)
        .group(numProjectsByMetro);

    selectFieldTeacher
        .dimension(teacherPrefixDim)
        .group(numProjectsByTeacherPrefix);

    dc.renderAll();

}