class Control {
    callback: (v: number) => void;
    tag: string;
    min: number;
    max: number;
    doc: Document;
    label: string;
    value: number;
    scale: number;
    control: HTMLInputElement | null = null;
    constructor(
        callback: (v: number) => void,
        tag: string,
        label: string,
        min: number,
        max: number,
        value: number,
        scale: number,
        doc: Document
    ){
        this.callback = callback;
        this.tag = tag;
        this.min = min;
        this.max = max;
        this.doc = doc;
        this.label = label;
        this.value = value;
        this.scale = scale;
    }
    node(): HTMLElement {
        var div = this.doc.createElement("div");
        div.setAttribute("id", this.tag);
        div.classList.add("ctrl");
        this.control = this.doc.createElement("input");
        this.control.setAttribute("type", "number");
        var control_tag = this.tag + "_control";
        this.control.setAttribute("id", control_tag);
        this.control.setAttribute("min", this.min.toString());
        this.control.setAttribute("max", this.max.toString());
        var step = Math.pow(10, Math.ceil(Math.log10((this.max - this.min) / 100)));
        this.control.setAttribute("step", step.toString());
        this.control.setAttribute("value", (this.value / this.scale).toFixed(3))
        this.control.addEventListener("change", (ev) => {
            var target = ev.target as HTMLInputElement;
            this.callback((+target.value) * this.scale);
        });
        var label = this.doc.createElement("label");
        label.setAttribute("for", control_tag);
        label.innerText = this.label;
        div.appendChild(this.control);
        div.appendChild(label);
        return div;
    }
}
export {Control}
