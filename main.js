"use strict";

// ===== GLOBAL VARS =====

// static variables
var STATIC = {
    PORTINTERVAL: 40,
    CANVASPADDING: 1.2,
    CABMINRADIUS: 100
}

// to keep track of the temporary ids given to newly created objects
var newCounter = 0;



// ===== OBJECTS =====

// The SVG object
var canvas = {
    tag: document.getElementById("canvas"),
    defs: document.getElementById("canvasdefs"),
    cables: document.getElementById("cables"),
    viewboxW: 0,
    viewboxH: 0,
    setViewbox: function(w, h) {
        this.viewboxW = w;
        this.viewboxH = h;
        this.tag.setAttribute("viewBox", -w/2 + " " + -h/2 + " " + w + " " + h);
    },
    getViewbox: function() {
        return {w: this.viewboxW, h: this.viewboxH};
    }
}

// The temporary line drawn while connecting 2 ports
var dragCable = {
    dragging: false,
    line: document.createElementNS("http://www.w3.org/2000/svg","line"),
    portid1: 0
}
dragCable.line.id = "dragline";

var Cab = function(id) {
    this.id = id;
    // tag creation
    this.tags = {
        group: document.createElementNS("http://www.w3.org/2000/svg","g"),
        circle: document.createElementNS("http://www.w3.org/2000/svg","circle"),
        text: document.createElementNS("http://www.w3.org/2000/svg","text")
    }
    // add ids & classes
    this.tags.group.id = "c" + id;
    this.tags.circle.setAttribute("class","cabcircle");
    this.tags.circle.setAttribute("cx",0);
    this.tags.circle.setAttribute("cy",0);
    this.tags.text.setAttribute("cabtext","cabcircle");
    this.tags.text.setAttribute("text-anchor","middle");
    this.tags.text.setAttribute("x",0);
    this.tags.text.setAttribute("y",0);
    // insert into DOM
    this.tags.group.appendChild(this.tags.circle);
    this.tags.group.appendChild(this.tags.text);
    // canvas.tag.appendChild(this.tags.group);
    canvas.tag.insertBefore(this.tags.group, canvas.cables);

    // functions
    this.move = function(x, y) {
        this.tags.group.setAttribute("transform","translate(" + x + " " + y + ")");
    }
    this.getContents = function() {
        var contents = {};
        for (var did in setup.list("d")) {
            if (setup.get("d", did).parentid != this.id) {
                continue;
            }
            contents[did] = [];
        }
        for (var pid in setup.list("p")) {
            var did = setup.get("p", pid).parentid;
            if (did in contents) {
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
                setup.get("p",pid).move(xy.x, xy.y, angleStep*node);
                node += 1;
            }
            var endArc = angleStep*(node - 1);
            node += 1;
            setup.get("d",did).arc(r, startArc, endArc);
        }
    }
    this.setLabel = function(label) {
        this.tags.text.innerHTML = label;
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
        textpath: document.createElementNS("http://www.w3.org/2000/svg","textPath"),
    }
    // add ids & classes
    this.tags.group.id = "d" + id;
    this.tags.path.id = "d" + id + "arc";
    this.tags.use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#" + this.tags.path.id);
    this.tags.textpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#" + this.tags.path.id);
    this.tags.textpath.setAttribute("startOffset","50%");
    this.tags.text.setAttribute("dy","-3px");
    this.tags.use.setAttribute("class", "devarc");
    this.tags.text.setAttribute("class","devtext");
    this.tags.text.setAttribute("text-anchor","middle");
    
    // insert into DOM
    setup.get("c",this.parentid).tags.group.appendChild(this.tags.group);
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
        this.tags.textpath.innerHTML = label;
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
    
    setup.get("d",this.parentid).tags.group.appendChild(this.tags.circle);
    setup.get("d",this.parentid).tags.group.appendChild(this.tags.text);
    this.tags.circle.setAttribute("class","portcircle");
    this.tags.circle.setAttribute("r",5);
    this.tags.text.setAttribute("class","porttext");
    this.tags.text.setAttribute("text-anchor","middle");
    this.tags.circle.id = "p" + this.id;

    this.tags.circle.addEventListener("click", function(e) {
        var id = (e.target.id).slice(1);
        if (!dragCable.dragging) {
            dragCable.dragging = true;
            canvas.tag.appendChild(dragCable.line);
            dragCable.portid1 = id;
            var pos = setup.get("p", id).getPos();
            dragCable.line.setAttribute("x1",pos.x);
            dragCable.line.setAttribute("y1",pos.y);
        } else {
            dragCable.dragging = false;
            canvas.tag.removeChild(dragCable.line);
            newCounter += 1;
            setup.insert("l", - newCounter, new Cable(- newCounter, dragCable.portid1, id))
            drawCables()
        }
    });


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
    this.getPos = function() {
        var x = this.tags.circle.getAttribute("cx");
        var y = this.tags.circle.getAttribute("cy");
        return {x: x, y: y};
    }
}

var Cable = function(id, portid1, portid2) {
    this.id = id;
    this.portid1 = portid1;
    this.portid2 = portid2;
    this.tags = {
        line: document.createElementNS("http://www.w3.org/2000/svg","line"),
        stroke: document.createElementNS("http://www.w3.org/2000/svg","line")
    }
    this.tags.stroke.setAttribute("class","cablestroke");
    canvas.cables.appendChild(this.tags.stroke);
    this.tags.line.setAttribute("class","cable");
    canvas.cables.appendChild(this.tags.line);
    
    
    this.draw = function() {
        var pos1 = setup.get("p",this.portid1).getPos();
        var pos2 = setup.get("p",this.portid2).getPos();
        this.tags.line.setAttribute("x1",pos1.x);
        this.tags.line.setAttribute("y1",pos1.y);
        this.tags.line.setAttribute("x2",pos2.x);
        this.tags.line.setAttribute("y2",pos2.y);
        this.tags.stroke.setAttribute("x1",pos1.x);
        this.tags.stroke.setAttribute("y1",pos1.y);
        this.tags.stroke.setAttribute("x2",pos2.x);
        this.tags.stroke.setAttribute("y2",pos2.y);
    }

    this.setColor = function(r, g, b) {
        this.tags.line.setAttribute("stroke","rgb(" + r + "," + g + "," + b + ")");
    }
}



// ===== EVENT HANDLERS =====

// moving the mouse within the canvas
var canvasMouseOver = function(e) {
    // 
    if (dragCable.dragging) {
        var viewbox = canvas.getViewbox();
        var svgW = viewbox.w;
        var svgH = viewbox.h;
        var windowW = window.innerWidth;
        var windowH = window.innerHeight;
        var mouseX = e.clientX;
        var mouseY = e.clientY;
        var scale = Math.min(windowW / svgW, windowH / svgH);

        var targetX = (mouseX - windowW/2) / scale;
        var targetY = (mouseY - windowH/2) / scale;
        
        dragCable.line.setAttribute("x2",targetX);
        dragCable.line.setAttribute("y2",targetY);
    }
}

canvas.tag.addEventListener("mousemove",canvasMouseOver);



// ===== HELPER FUNCTIONS =====

// converts polar coordinates (radius, angle) into x and y
function getXy(r,a) {
    var rad = a / 360 * 2 * Math.PI;
    var x = r * Math.cos(rad);
    var y = r * Math.sin(rad);
    return {x: x, y: y};
}

// returns a list of n distinct rgb values
function listOfColors(n) {
    var colors = [];
    var ratios = [
        [1,0,0],
        [1,1,0],
        [0,1,0],
        [0,1,1],
        [0,0,1],
        [1,0,1]
    ];
    for (var i = 0; i < n; i++) {
        var x = i / n * 6;
        var f = Math.floor(x) % 6;
        var c = Math.ceil(x) % 6;
        var r = x % 1;
        var color = [];
        for (var j = 0; j < 3; j++) {
            color.push(Math.round((ratios[c][j] * (1-r) + ratios[f][j] * r) * 128 + 70));
        }
        colors.push(color);
    }
    return colors;
}



// ===== DATA MANAGEMENT =====

// example data object
var exampleData = {
    c: [
        {
            id: 11,
            label: "Cabinet"
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
        },
        {
            id: 23,
            parentid: 11,
            label: "device 3"
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
        },
        {
            id: 36,
            parentid: 23,
            label: "port 5"
        },
        {
            id: 37,
            parentid: 23,
            label: "port 5"
        },
        {
            id: 38,
            parentid: 23,
            label: "port 5"
        },
        {
            id: 39,
            parentid: 23,
            label: "port 5"
        }
    ],
    l: [
        {
            id: 61,
            id1: 33,
            id2: 32
        },
        {
            id: 62,
            id1: 34,
            id2: 31
        },
        {
            id: 63,
            id1: 35,
            id2: 39
        },
        {
            id: 64,
            id1: 36,
            id2: 38
        },
    ]
}

// the object containing all of the created objects (cabs, devices, ports, cables)
var setup = {
    c: [],
    d: [],
    p: [],
    l: [],
    // inserts an object of a type with an id inside setup
    insert: function(type, id, object) {
        this[type][type + id] = object;
    },
    // returns the object of a certain id with a certain type
    get: function(type, id) {
        return this[type][type + id];
    },
    // returns a dictionary of all objects of a certian type with id:object
    list: function(type) {
        var returnDict = {}
        for (var key in this[type]) {
            returnDict[key.slice(1)] = this[type][key];
        }
        return returnDict;
    },
    getLength: function(type) {
        return Object.keys(this[type]).length;
    }
}

// insert data received from the server into the setup object
function importData(data) {
    for (var i in data.c) {
        var id = data.c[i]["id"];
        var label = data.c[i]["label"];
        setup.insert("c",id,new Cab(id));
        setup.get("c",id).setLabel(label);
    }
    for (var i in data.d) {
        var id = data.d[i]["id"];
        var parentid = data.d[i]["parentid"];
        var label = data.d[i]["label"];
        setup.insert("d",id,new Device(id, parentid));
        setup.get("d",id).setLabel(label);
    }
    for (var i in data.p) {
        var id = data.p[i]["id"];
        var parentid = data.p[i]["parentid"];
        var label = data.p[i]["label"];
        setup.insert("p",id,new Port(id, parentid));
        setup.get("p",id).setLabel(label.toUpperCase());
    }
    for (var i in data.l) {
        var id = data.l[i]["id"];
        var id1 = data.l[i]["id1"];
        var id2 = data.l[i]["id2"];
        setup.insert("l",id,new Cable(id, id1, id2));
    }
}



// ===== INITIALISATION =====

importData(exampleData);

canvas.setViewbox(300,300);

for (var id in setup.list("c")) {
    setup.get("c",id).draw();
}

var drawCables = function() {
    var n = setup.getLength("l");
    var colors = listOfColors(n);
    for (var id in setup.list("l")) {
        setup.get("l",id).draw();
        var color = colors.pop()
        setup.get("l",id).setColor(color[0], color[1], color[2]);
    }
}

drawCables();

