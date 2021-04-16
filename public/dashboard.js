/// import * as Autodesk from "@types/forge-viewer";
/// import * as Chart from "@types/chart.js";

/**
 * Sets up the dashboard interface.
 * @param {Autodesk.Viewing.GuiViewer3D} viewer 
 */
export function initializeDashboard(viewer) {
    const barChart = createBarChart(document.getElementById('bar-chart'));
    const pieChart = createPieChart(document.getElementById('pie-chart'));
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, async function (ev) {
        const data = await getData(viewer, ev.model);
        debugger;
        updateBarChart(barChart, data);
        updatePieChart(pieChart, data);
    });
}

function createBarChart(canvas) {
    return new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    data: [],
                    backgroundColor: 'rgba(0, 0.6, 0.9, 0.2)',
                    borderColor: 'rgba(0, 0.6, 0.9, 1.0)',
                    borderWidth: 1
                }
            ],
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                legend: {
                    display: false
                },
                onClick: function (ev, item) {
                    //_this.viewer.isolate(_this.modelData.getIds(_this.propertyToUse, item[0]._model.label));
                    alert('Hello from bar chart');
                }
            }
        }
    });
}

function updateBarChart(chart, data) {
    const propertyValues = Object.keys(data);
    chart.data.labels = propertyValues;
    const dataset = chart.data.datasets[0];
    dataset.data = propertyValues.map(val => {
        const ids = data[val];
        return ids.length;
    });
    chart.update();
}

function createPieChart(canvas) {
    return new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: 'rgba(0, 0.6, 0.9, 0.2)',
                borderColor: 'rgba(0, 0.6, 0.9, 1.0)',
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: true
            },
            onClick: function (evt, item) {
                //_this.viewer.isolate(_this.modelData.getIds(_this.propertyToUse, item[0]._model.label));
                alert('Hello from pie chart');
            }
        }
    });
}

function updatePieChart(chart, data) {
    const propertyValues = Object.keys(data);
    chart.data.labels = propertyValues;
    const dataset = chart.data.datasets[0];
    dataset.data = propertyValues.map(val => {
        const ids = data[val];
        return ids.length;
    });
    chart.update();
}

async function getData(viewer, model) {
    return {
        'Steel': [12, 34, 56, 78],
        'Concrete': [14, 15, 16, 17],
        'Wood': [8],
        'Glass': [3, 4, 5, 6, 7]
    };
}