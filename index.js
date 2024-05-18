fetch('https://raw.githubusercontent.com/Ari050/NYCdataset/main/NYC.json')
    .then(response => response.json())
    .then(data => {
        const salesData = processData(data);
        createLineChart('chart1', salesData.lineData);
        createPriceRangePieChart('chart2', salesData.priceRangeData);
        createUnitsLineChart('chart3', salesData);
        createDoughnutChart('chart4', salesData.pieData);
        createBarChart('chart5', salesData.barData);
    })
    .catch(error => console.error('Error fetching data:', error));

function processData(data) {
    const salesByBorough = {};
    const salesCounts = {};
    const priceRanges = {
        "0 - 20": 0,
        "20 - 100.000": 0,
        "100.000 - 10.000.000": 0,
        "10.000.000 - 1.000.000.000": 0,
        "> 1.000.000.000": 0
    };

    const residentialUnits = {};
    const commercialUnits = {};

    data.forEach(item => {
        const borough = item.BOROUGH;
        const saleDate = new Date(item.SALE_DATE);
        const salePrice = parseFloat(item.SALE_PRICE);
        const monthYear = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
        const resUnits = parseInt(item.RESIDENTIAL_UNITS, 10) || 0;
        const comUnits = parseInt(item.COMMERCIAL_UNITS, 10) || 0;

        if (!salesByBorough[borough]) {
            salesByBorough[borough] = {};
        }
        if (!salesByBorough[borough][monthYear]) {
            salesByBorough[borough][monthYear] = 0;
        }
        salesByBorough[borough][monthYear]++;

        if (!salesCounts[borough]) {
            salesCounts[borough] = 0;
        }
        salesCounts[borough]++;

        if (salePrice > 0 && salePrice <= 20) {
            priceRanges["0 - 20"]++;
        } else if (salePrice > 20 && salePrice <= 100000) {
            priceRanges["20 - 100.000"]++;
        } else if (salePrice > 100000 && salePrice <= 10000000) {
            priceRanges["100.000 - 10.000.000"]++;
        } else if (salePrice > 10000000 && salePrice <= 1000000000) {
            priceRanges["10.000.000 - 1.000.000.000"]++;
        } else if (salePrice > 1000000000) {
            priceRanges["> 1.000.000.000"]++;
        }

        if (!residentialUnits[monthYear]) {
            residentialUnits[monthYear] = 0;
        }
        residentialUnits[monthYear] += resUnits;

        if (!commercialUnits[monthYear]) {
            commercialUnits[monthYear] = 0;
        }
        commercialUnits[monthYear] += comUnits;
    });

    const labels = Array.from(new Set(data.map(item => {
        const saleDate = new Date(item.SALE_DATE);
        return `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
    }))).sort();

    const lineDatasets = Object.keys(salesByBorough).map(borough => {
        return {
            label: borough,
            data: labels.map(label => salesByBorough[borough][label] || 0),
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        };
    });

    const lineDatat = {
        labels: labels,
        datasets: [
            {
                label: 'Residential Units',
                data: labels.map(label => residentialUnits[label] || 0),
                borderColor: 'blue',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Commercial Units',
                data: labels.map(label => commercialUnits[label] || 0),
                borderColor: 'green',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const barData = {
        labels: Object.keys(salesCounts),
        datasets: [{
            label: 'Total Sales by Borough',
            data: Object.values(salesCounts),
            backgroundColor: Object.keys(salesCounts).map(() => getRandomColor()),
        }]
    };

    const pieData = {
        labels: Object.keys(salesCounts),
        datasets: [{
            data: Object.values(salesCounts),
            backgroundColor: Object.keys(salesCounts).map(() => getRandomColor())
        }]
    };

    const priceRangeData = {
        labels: Object.keys(priceRanges),
        datasets: [{
            data: Object.values(priceRanges),
            backgroundColor: Object.keys(priceRanges).map(() => getRandomColor())
        }]
    };

    return { labels, lineData: { labels, datasets: lineDatasets }, lineDatat, barData, pieData, priceRangeData };
}

function createLineChart(chartId, lineData) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: lineData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Total Sales in Each Borough by Month',
                    color: 'white',
                }
            }
        }
    });
}

function createPriceRangePieChart(chartId, priceRangeData) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: priceRangeData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Sales Distribution by Price Range',
                    color: 'white'
                }
            }
        }
    });
}

function createUnitsLineChart(chartId, salesData) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: salesData.lineDatat,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Sales of Residential and Commercial Units by Month',
                    color: 'white'
                }
            }
        }
    });
}




function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}