/// import * as Autodesk from "@types/forge-viewer";
/// import * as Chart from "@types/chart.js";

/**
 * Sets up the dashboard interface.
 * @param {Autodesk.Viewing.GuiViewer3D} viewer 
 */
export async function initializeDashboard(viewer) {
    const barChart = createBarChart(document.getElementById('bar-chart'));
    const pieChart = createPieChart(document.getElementById('pie-chart'));
    const summaryExt = await viewer.loadExtension('SummaryExtension');
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, async function (ev) {
        try {
            const propName = 'Material';
            const summary = await summaryExt.findPropertyOccurrences(ev.model, propName);
            updateBarChart(barChart, summary, propName);
            updatePieChart(pieChart, summary, propName);
        } catch (err) {
            console.log(err);
            updateBarChart(barChart, {});
            updatePieChart(pieChart, {});
        }
    });
}

function generateRandomColors(count, alpha = 1.0) {
    let colors = [];
    for (let i = 0; i < count; i++) {
        const r = Math.round(Math.random() * 255);
        const g = Math.round(Math.random() * 255);
        const b = Math.round(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
    }
    return colors;
}

function createBarChart(canvas) {
    return new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
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
                }
            }
        }
    });
}

function updateBarChart(chart, data, label) {
    const propertyValues = Object.keys(data);
    chart.data.labels = propertyValues;
    const dataset = chart.data.datasets[0];
    dataset.label = label;
    dataset.data = propertyValues.map(val => {
        const ids = data[val];
        return ids.length;
    });
    dataset.backgroundColor = dataset.borderColor = generateRandomColors(propertyValues.length, 0.2);
    chart.update();
}

function createPieChart(canvas) {
    return new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
        },
        options: {
            legend: {
                display: true
            }
        }
    });
}

function updatePieChart(chart, data, label) {
    const propertyValues = Object.keys(data);
    chart.data.labels = propertyValues;
    const dataset = chart.data.datasets[0];
    dataset.label = label;
    dataset.data = propertyValues.map(val => {
        const ids = data[val];
        return ids.length;
    });
    dataset.backgroundColor = dataset.borderColor = generateRandomColors(propertyValues.length, 0.2);
    chart.update();
}
