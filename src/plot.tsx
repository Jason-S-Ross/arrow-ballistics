import * as d3 from "d3";
import { Record } from "./calc"
class Plot {
    margin = {top: 10, right: 30, bottom: 30, left: 60};
    width = 800 - this.margin.left - this.margin.right;
    height = 400 - this.margin.top - this.margin.bottom;
    svg: d3.Selection<SVGElement, any, HTMLElement, any>;
    xScale: d3.ScaleLinear<number, number, never>;
    yScale: d3.ScaleLinear<number, number, never>;
    xAxis: d3.Axis<d3.NumberValue>;
    yAxis: d3.Axis<d3.NumberValue>;
    xAxisGroup: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
    yAxisGroup: d3.Selection<SVGSVGElement, any, HTMLElement, any>;

    path: d3.Selection<SVGSVGElement, any, any, any>;
    xExtractor: (d: Record) => number;
    yExtractor: (d: Record) => number;
    constructor(
        key: string,
        xExtractor: (d: Record) => number,
        yExtractor: (d: Record) => number
    ) {
        this.svg = d3.select<HTMLElement, any>(key)
            .append<SVGElement>("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append<SVGElement>("g")
            .attr("transform",
                  "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.xAxis = d3.axisBottom(this.xScale);
        this.xAxisGroup = this.svg.append<SVGSVGElement>("g")
            .classed("x", true)
            .classed("axis", true)
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis);

        this.yScale = d3.scaleLinear().range([this.height, 0]);
        this.yAxis =d3.axisLeft(this.yScale);

        this.yAxisGroup = this.svg.append<SVGSVGElement>("g")
            .classed("y", true)
            .classed("axis", true)
            .call(this.yAxis);
        this.xExtractor = xExtractor;
        this.yExtractor = yExtractor;
        this.path = this.svg.append<SVGSVGElement>("path")
            .datum([])
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d",
                  d3.line<Record>()
                      .x((d: Record) => this.xScale(this.xExtractor(d)))
                      .y((d: Record) => this.yScale(this.yExtractor(d))));

    }

    plot(records: Record[]) {
        var x_bound = d3.extent(records, this.xExtractor).map((x)=> x as number);
        var y_bound = d3.extent(records, this.yExtractor).map((x)=> x as number);
        y_bound[0] = 0;
        x_bound[0] = 0;
        this.xScale.domain(x_bound);
        this.yScale.domain(y_bound);
        this.xAxisGroup.call(this.xAxis);
        this.yAxisGroup.call(this.yAxis);
        this.path.datum(records)
            .attr("d",
                  d3.line<Record>()
                      .x((d: Record) => this.xScale(this.xExtractor(d)))
                      .y((d: Record) => this.yScale(this.yExtractor(d)))) ;
    }

}
export { Plot };
