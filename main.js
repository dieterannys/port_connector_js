"use strict";

var STATIC = {
    PORTINTERVAL: 70,
    CANVASPADDING: 1.2,
    CABMINRADIUS: 100
}

// ===== OBJECTS =====

var canvas = {
    tag: document.getElementById("canvas"),
    defs: document.getElementById("canvasdefs"),
    setViewbox: function(w, h) {
        this.tag.setAttribute("viewBox", -w/2 + " " + -h/2 + " " + w + " " + h);
    }
}

var setup = {
    c: [],
    d: [],
    p: []
}

var Cab = function(id) {
    this.id = id;
    // tag creation
    this.tags = {
        group: document.createElementNS("http://www.w3.org/2000/svg","g"),
        circle: document.createElementNS("http://www.w3.org/2000/svg","circle")
    }
    // add ids & classes
    this.tags.group.id = "c" + id;
    this.tags.circle.setAttribute("class","cabcircle");
    this.tags.circle.setAttribute("cx",0);
    this.tags.circle.setAttribute("cy",0);
    // insert into DOM
    this.tags.group.appendChild(this.tags.circle);
    canvas.tag.appendChild(this.tags.group);

    // functions
    this.move = function(x, y) {
        this.tags.group.setAttribute("transform","translate(" + x + " " + y + ")");
    }
    this.getContents = function() {
        var contents = {};
        for (var did in setup.d) {
            if (setup.d[did].parentid != this.id) {
                continue;
            }
            contents[did] = [];
        }
        for (var pid in setup.p) {
            var did = setup.p[pid].parentid;
            if (setup.p[pid].parentid in contents) {
                contents[did].push(pid);
            }
        }
        return contents;
    }
    this.draw = function() {
        var contents = this.getContents();

        var nodeAmount = 0;
        for (var did in contents) {
            nodeAmount += 1 + contents[did].length;
        }

        var r = Math.max(STATIC.PORTINTERVAL * nodeAmount / (2 * Math.PI), STATIC.CABMINRADIUS);
        this.tags.circle.setAttribute("r",r);
        canvas.setViewbox(2 * r * STATIC.CANVASPADDING, 2 * r * STATIC.CANVASPADDING);

        var angleStep = 360 / nodeAmount;

        var node = 0;

        for (var did in contents) {
            var startArc = angleStep*node;
            for (var i in contents[did]) {
                var pid = contents[did][i];
                var xy = getXy(r, angleStep*node);
                setup.p[pid].move(xy.x, xy.y, angleStep*node);
                node += 1;
            }
            var endArc = angleStep*(node - 1);
            node += 1;
            setup.d[did].arc(r, startArc, endArc);
        }
    }

}

var Device = function(id, parentid) {
    this.id = id;
    this.parentid = parentid;
    // tag creation
    this.tags = {
        group: document.createElementNS("http://www.w3.org/2000/svg","g"),
        path: document.createElementNS("http://www.w3.org/2000/svg","path"),
        use: document.createElementNS("http://www.w3.org/2000/svg","use"),
        text: document.createElementNS("http://www.w3.org/2000/svg","text"),
        textpath: document.createElementNS("http://www.w3.org/2000/svg","textpath"),
    }
    // add ids & classes
    this.tags.group.id = "d" + id;
    this.tags.path.id = "d" + id + "arc";
    this.tags.use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#" + this.tags.path.id);
    this.tags.textpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#" + this.tags.path.id);
    this.tags.use.setAttribute("class", "devarc");
    this.tags.text.setAttribute("class","devtext");
    
    // insert into DOM
    setup.c[parentid].tags.group.appendChild(this.tags.group);
    canvas.defs.appendChild(this.tags.path);
    this.tags.group.appendChild(this.tags.use);
    this.tags.group.appendChild(this.tags.text);
    this.tags.text.appendChild(this.tags.textpath);

    this.arc = function(r, startAngle, endAngle)  {
        var xy = getXy(r, startAngle);
        var x = xy.x;
        var y = xy.y;
        var pathD = "M " + x + " " + y + " ";
        xy = getXy(r, endAngle);
        x = xy.x;
        y = xy.y;
        var largeArc;
        if ((endAngle - startAngle) < 180) {
            largeArc = 0;
        } else {
            largeArc = 1;
        }
        pathD += "A " + r + " " + r + " 0 " + largeArc + " 1 " + x + " " + y;
        this.tags.path.setAttribute("d",pathD);
    }
    this.setLabel = function(label) {
        this.tags.textpath.textContent = label;
    }
}

var Port = function(id, parentid) {
    this.id = id;
    this.parentid = parentid;
    // tag creation
    this.tags = {
        circle: document.createElementNS("http://www.w3.org/2000/svg","circle"),
        text: document.createElementNS("http://www.w3.org/2000/svg","text"),
    }
    setup.d[this.parentid].tags.group.appendChild(this.tags.circle);
    setup.d[this.parentid].tags.group.appendChild(this.tags.text);
    this.tags.circle.setAttribute("class","portcircle");
    this.tags.circle.setAttribute("r",5);
    this.tags.text.setAttribute("class","porttext");
    this.tags.text.setAttribute("text-anchor","middle");
    
    this.move = function(x,y,a) {
        this.tags.circle.setAttribute("cx",x);
        this.tags.circle.setAttribute("cy",y);
        this.tags.text.setAttribute("x",x);
        this.tags.text.setAttribute("y",y+12);
        var aT = (a + 90) % 360;
        if (aT >= 90 && aT < 270) {
            aT -= 180;
            this.tags.text.setAttribute("y",y-8);
        } else {
            this.tags.text.setAttribute("y",y+12);
        }
        this.tags.text.setAttribute("transform","rotate(" + aT + " " + x + " " + y + ")")
    }
    this.setLabel = function(label) {
        this.tags.text.innerHTML = label;
    }
}


//

function getXy(r,a) {
    var rad = a / 360 * 2 * Math.PI;
    var x = r * Math.cos(rad);
    var y = r * Math.sin(rad);
    return {x: x, y: y};
}

var example = {
    c: [
        {
            id: 11
        }
    ],
    d: [
        {
            id: 21,
            parentid: 11,
            label: "device 1"
        },
        {
            id: 22,
            parentid: 11,
            label: "device 2"
        }
    ],
    p: [
        {
            id: 31,
            parentid: 21,
            label: "port 1"
        },
        {
            id: 32,
            parentid: 21,
            label: "port 2"
        },
        {
            id: 33,
            parentid: 21,
            label: "port 3"
        },
        {
            id: 34,
            parentid: 22,
            label: "port 4"
        },
        {
            id: 35,
            parentid: 22,
            label: "port 5"
        }
    ]
}

function importData(data) {
    for (var i in data.c) {
        var id = data.c[i]["id"];
        setup.c[id] = new Cab(id);
    }
    for (var i in data.d) {
        var id = data.d[i]["id"];
        var parentid = data.d[i]["parentid"];
        var label = data.d[i]["label"];
        setup.d[id] = new Device(id, parentid);
        setup.d[id].setLabel(label);
    }
    for (var i in data.p) {
        var id = data.p[i]["id"];
        var parentid = data.p[i]["parentid"];
        var label = data.p[i]["label"];
        setup.p[id] = new Port(id, parentid);
        setup.p[id].setLabel(label.toUpperCase());
    }
}

importData(example);

canvas.setViewbox(300,300);

for (var id in setup.c) {
    setup.c[id].draw();
}