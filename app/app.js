/**
 * @desc - Loads a customized table with all Solutions available
 * Author: https://www.linkedin.com/in/sabatieralexandre/
 * -------------------------
 * Open Source Dependencies
 * -------------------------
 * Icon - MIT - https://github.com/feathericons/feather
 * Table generation - MIT - https://github.com/grid-js/gridjs
 * Charts generation - MIT - https://github.com/chartjs/Chart.js
 * jQuery - MIT - https://github.com/jquery/jquery
 * MomentJS - MIT - https://github.com/moment/moment/
 */

$(document).ready(() => {
    /** Tiggered when Page is loaded for the first time
     * @fires , @async - app.initialized()
     */
    app.initialized().then((_client) => { // Obtains client object
        window.client = _client;

        /** Triggered when App is used/activated
         * @fires - Invokes main function.
         * @async
         */
        client.events.on('app.activated', () => {
            kbreporting();
        });

    }).catch((err) => {
        console.error('App activation failed.', err);
        showError('The application failed to initialize!. Contact Support.')
    });
});

/**
 *   Standard Interface API for error on-screen notifications.
 */
function showError(msg) {
    client.interface.trigger('showNotify', {
        type: 'danger',
        message: msg,
    });
}

/**
 *   Custom function for search and replace.
 */
function findAndReplace(object, value, keytoreplace, replacevalue) {
    for (var x in object) {
        if (typeof object[x] == typeof {}) {
            findAndReplace(object[x], value, keytoreplace, replacevalue);
        }
        if (object[x] == value) {
            object[keytoreplace] = replacevalue;
            // break; // uncomment to stop after first replacement
        }
    }
}

/**
 *   Main Function to generate tables and charts
 */
function kbreporting() {

    // Headers for API requests (API Key from iparams.json)
    var options = {
        headers: {
            Authorization: "Basic <%= encode(iparam.apiKey)%>",
            "Content-Type": "application/json;charset=utf-8"
        }
    }

    client.request.get("https://<%=iparam.domainName%>.freshdesk.com/api/v2/solutions/categories?per_page=100&page=1", options)
        .then(function(response) {

            // searches for categories IDs, replaces with names and updates results
            var presponse = JSON.parse(response.response)

            // returns total number of categories
            var ncat = presponse.length
            // console.log(ncat)

            // variable to store categories id for i categories count
            var idcat = []
            // loops through categories
            for (i = 0; i < ncat; i++) {
                idcat.push(presponse[i].id)
                // console.log("Pass! Category idcat[0] = " + idcat[0])
            }

            // variable to store categories names for i categories count
            var namecat = []
            // loops through categories
            for (i = 0; i < ncat; i++) {
                namecat.push(presponse[i].name)
                // console.log("Pass! Name namecat[0] = " + namecat[0])
            }

            // variable to store folders urls for i categories count
            var urlfolders = []
            for (i = 0; i < ncat; i++) {
                urlfolders.push("https://<%=iparam.domainName%>.freshdesk.com" + `/api/v2/solutions/categories/${idcat[i]}/folders?per_page=100`)
                // console.log("Pass! URL urlfolders[0] = " + urlfolders[0])
            }

            // fetch all folders for all categories
            fetchData = () => {
                var allFoldersRequests = urlfolders.map(url =>
                    client.request.get(url, options).then(response => JSON.parse(response.response))
                );

                return Promise.all(allFoldersRequests)
            };

            // converts promise with all folders
            fetchData().then(arrayForallfolders => {

                    // flattens promise
                    var ffolders = [].concat.apply([], arrayForallfolders);
                    // returns total number of folders
                    var nfolders = ffolders.length
                    console.log(nfolders)
                    console.log(arrayForallfolders)

                    // variable to store all folder ids for i folders count
                    var foldersid = []
                    // loops through folders
                    for (i = 0; i < nfolders; i++) {
                        foldersid.push(ffolders[i].id)
                        // console.log("Pass! Folder folderid[0] = " + foldersid[0])
                    }

                    // variable to store folders names for i folders count
                    var namefol = []
                    // loops through folders
                    for (i = 0; i < nfolders; i++) {
                        namefol.push(ffolders[i].name)
                        // console.log("Pass! Name namefol[0] = " + namefol[0])
                    }

                    report_counthitsperfolder(namefol);

                    // variable to store folders with articles urls for i folders count
                    var urlfoldersarticles = []
                    for (i = 0; i < nfolders; i++) {
                        // To be improved - limited to 100 results
                        urlfoldersarticles.push(`https://<%=iparam.domainName%>.freshdesk.com/api/v2/solutions/folders/${foldersid[i]}/articles?per_page=100`)
                        // console.log("Pass! URL urlfoldersarticles[0] = " + urlfoldersarticles[0])
                    }

                    // fetch all articles in all folders
                    fetchData = () => {
                        var allArticlesRequests = urlfoldersarticles.map(url =>
                            client.request.get(url, options).then(response => JSON.parse(response.response))
                        );

                        return Promise.all(allArticlesRequests);
                    };

                    fetchData().then(arrayForallarticles => {

                            // variable to store articles count for each folder
                            var countarticles = []
                            for (i = 0; i < nfolders; i++) {
                                countarticles.push(arrayForallarticles[i].length)
                                // console.log(arrayForallarticles[5])
                            }

                            // variable to store all articles per folder
                            var arrayForallfolders = []
                            for (i = 0; i < nfolders; i++) {
                                arrayForallfolders.push(arrayForallarticles[i])
                            }
                            console.log(arrayForallfolders)

                            // variables to store various counts per folder
                            var countthumbsDF = []
                            var countsuggestedF = []
                            var counthitsF = []
                            for (x = 0; x < nfolders; x++) {
                                var countthumbsD = 0
                                for (i = 0; i < arrayForallfolders[x].length; i++) {
                                    countthumbsD += arrayForallfolders[x][i].thumbs_down;
                                    countthumbsDF.push(countthumbsD)
                                }
                                var countsuggested = 0
                                for (i = 0; i < arrayForallfolders[x].length; i++) {
                                    countsuggested += arrayForallfolders[x][i].suggested;
                                    countsuggestedF.push(countsuggested)
                                }
                                var counthits = 0
                                for (i = 0; i < arrayForallfolders[x].length; i++) {
                                    counthits += arrayForallfolders[x][i].hits;
                                    counthitsF.push(counthits)
                                }
                                console.log(counthitsF)
                            }

                            // checks if any previous counts is zero
                            /*var sumcountthumbsDF = countthumbsDF.reduce(function(a, b){
                                return a + b;
                            }, 0);*/
                            // console.log(sumcountthumbsDF)
                            /*var sumcountsuggestedF = countsuggestedF.reduce(function(a, b){
                                return a + b;
                            }, 0);*/
                            // console.log(sumcountsuggestedF)
                            var sumcounthitsF = counthitsF.reduce(function(a, b) {
                                return a + b;
                            }, 0);
                            // console.log(sumcounthitsF)

                            report_countartperfolder(namefol, countarticles);
                            report_counthitsperfolder(namefol, counthitsF, sumcounthitsF);

                            // flattens promise
                            var farticles = [].concat.apply([], arrayForallarticles);

                            // only Draft Solutions
                            var farticles_d = farticles.filter(element => element.status == 1)
                            // console.log(farticles_d)

                            // gets sub-domain and invokes function for chart 3
                            client.data.get('domainName').then((data) => {
                              var subdomain = data.domainName
                              report_draftsolutions(subdomain, farticles_d);
                              }, (err) => {
                                showError('The subdomain could not be identified (check App Settings).');
                                console.error('The domainName request failed.', err);
                              });

                            // only Solutions with user feedback
                            var farticles_f = farticles.filter(element => element.feedback_count > 0)
                            // console.log(farticles_f)

                            // gets sub-domain and invokes function for chart 3
                            client.data.get('domainName').then((data) => {
                              var subdomain = data.domainName
                              report_artuserfeedback(subdomain, farticles_f);
                              }, (err) => {
                                showError('The subdomain could not be identified (check App Settings).');
                                console.error('The domainName request failed.', err);
                              });

                            // returns total number of articles
                            var narticles = farticles.length

                            // returns various sorted results for articles
                            var sortedartsuggested = farticles.sort(function(a, b) {
                                return b.suggested - a.suggested
                            });
                            // console.log(sortedartsuggested)
                            // var sortedartviews = farticles.sort(function(a,b){ return b.hits - a.hits  });
                            // var sortedartthumbsD = farticles.sort(function(a,b){ return b.thumbs_down - a.thumbs_down  });

                            // gets sub-domain and invokes function for Main table
                            client.data.get('domainName').then((data) => {
                              var subdomain = data.domainName
                              maintable(subdomain, sortedartsuggested);
                              }, (err) => {
                                showError('The subdomain could not be identified (check App Settings).');
                                console.error('The domainName request failed.', err);
                              });

                            // search and replace category ids with names
                            var keytoreplace = "category_id"
                            for (i = 0; i < narticles; i++) {
                                findAndReplace(farticles, idcat[i], keytoreplace, namecat[i]);
                            }

                            // variable to store dates for i articles count
                            var idates = []
                            // loops through categories
                            for (i = 0; i < narticles; i++) {
                                idates.push(farticles[i].updated_at)
                                // console.log("Pass! Date idates[0] = " + idates[0])
                            }

                            // variable to store converted dates for i articles count
                            var cdates = []
                            // loops through categories
                            for (i = 0; i < narticles; i++) {
                                var jsDate = moment(idates[i]).format("DD-MM-YYYY, h:mm A")
                                cdates.push(jsDate)
                                // console.log("Pass! Converted date cdates[0] = " + cdates[0])
                            }

                            // search and replace dates with converted format
                            var keytoreplace = "updated_at"
                            for (i = 0; i < narticles; i++) {
                                findAndReplace(farticles, idates[i], keytoreplace, cdates[i]);
                            }

                            // Gives stats in App title
                            document.getElementById('titlestats').innerHTML = "Found " + narticles + " solutions in " + ncat + " categories and " + nfolders + " folders.";

                        })
                        .catch((error) => {
                            console.log("Table could not be generated! Articles not loaded. Status Code: " + error.status + " - " + error.response)
                            showError('Table could not be generated! Articles not loaded. Contact Support.')
                        })
                })
                .catch((error) => {
                    console.log("Table could not be generated! Folders not loaded. Status Code: " + error.status + " - " + error.response)
                    showError('Table could not be generated! Folders not loaded. Contact Support.')
                })

                .catch((error) => {
                    console.log("Table could not be generated! Status Code: " + error.status + " - " + error.response)
                    showError('Table could not be generated! Contact Support.')
                });

        })
        .catch((error) => {
            console.log("Table or reports could not be loaded..! " + error.status + " - " + error.response)
            showError('Table or reports could not be generated! Failed to load categories. Contact Support.')
        });
}

function maintable(subdomain, sortedartsuggested) {
    // necessary to load Gridjs html function (formatter)
    var {
        html
    } = gridjs;
    // generates table
    new gridjs.Grid({
        columns: [{
                name: "Category",
                id: "category_id"
            },
            {
                name: "ID",
                id: "id"
            },
            {
                name: "Title (Link)",
                id: "title",
                formatter: (_, row) =>
                    html(`<a target="_blank" href='https://${subdomain}/a/solutions/articles/${row.cells[1].data}'>${row.cells[2].data}</a>`)
            },
            {
                name: "Last Update (DD-MM)",
                id: "updated_at"
            },
            {
                name: "Views",
                id: "hits"
            },
            {
                name: "Suggested",
                id: "suggested"
            },
            {
                name: "Not Helpful",
                id: "thumbs_down"
            }
        ],
        data: sortedartsuggested,
        language: {
            'search': {
                'placeholder': '🔍 Start typing...'
            },
            'pagination': {
                'showing': '🤓 Displaying',
                'results': () => 'Solutions'
            }
        },
        search: true,
        pagination: {
            enabled: true,
            limit: 20
        },
        sort: true
    }).render(document.getElementById("wrapper"));
}

// Color Palette for charts
var colorpalette = ["#69d2e7", "#a7dbd8", "#e0e4cc", "#f38630", "#fa6900", "#fe4365", "#fc9d9a", "#f9cdad", "#c8c8a9", "#83af9b", "#ecd078", "#d95b43", "#c02942", "#542437", "#53777a", "#556270", "#4ecdc4", "#c7f464", "#ff6b6b", "#c44d58", "#774f38", "#e08e79", "#f1d4af", "#ece5ce", "#c5e0dc", "#e8ddcb", "#cdb380", "#036564", "#033649", "#031634", "#490a3d", "#bd1550", "#e97f02", "#f8ca00", "#8a9b0f", "#594f4f", "#547980", "#45ada8", "#9de0ad", "#e5fcc2", "#00a0b0", "#6a4a3c", "#cc333f", "#eb6841", "#edc951", "#e94e77", "#d68189", "#c6a49a", "#c6e5d9", "#f4ead5", "#3fb8af", "#7fc7af", "#dad8a7", "#ff9e9d", "#ff3d7f", "#d9ceb2", "#948c75", "#d5ded9", "#7a6a53", "#99b2b7", "#ffffff", "#cbe86b", "#f2e9e1", "#1c140d", "#cbe86b", "#efffcd", "#dce9be", "#555152", "#2e2633", "#99173c", "#343838", "#005f6b", "#008c9e", "#00b4cc", "#00dffc", "#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be", "#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#99b898", "#fecea8", "#ff847c", "#e84a5f", "#2a363b", "#655643", "#80bca3", "#f6f7bd", "#e6ac27", "#bf4d28", "#00a8c6", "#40c0cb", "#f9f2e7", "#aee239", "#8fbe00", "#351330", "#424254", "#64908a", "#e8caa4", "#cc2a41", "#554236", "#f77825", "#d3ce3d", "#f1efa5", "#60b99a", "#5d4157", "#838689", "#a8caba", "#cad7b2", "#ebe3aa", "#8c2318", "#5e8c6a", "#88a65e", "#bfb35a", "#f2c45a", "#fad089", "#ff9c5b", "#f5634a", "#ed303c", "#3b8183", "#ff4242", "#f4fad2", "#d4ee5e", "#e1edb9", "#f0f2eb", "#f8b195", "#f67280", "#c06c84", "#6c5b7b", "#355c7d", "#d1e751", "#ffffff", "#000000", "#4dbce9", "#26ade4", "#1b676b", "#519548", "#88c425", "#bef202", "#eafde6", "#5e412f", "#fcebb6", "#78c0a8", "#f07818", "#f0a830", "#bcbdac", "#cfbe27", "#f27435", "#f02475", "#3b2d38", "#452632", "#91204d", "#e4844a", "#e8bf56", "#e2f7ce", "#eee6ab", "#c5bc8e", "#696758", "#45484b", "#36393b", "#f0d8a8", "#3d1c00", "#86b8b1", "#f2d694", "#fa2a00", "#2a044a", "#0b2e59", "#0d6759", "#7ab317", "#a0c55f", "#f04155", "#ff823a", "#f2f26f", "#fff7bd", "#95cfb7", "#b9d7d9", "#668284", "#2a2829", "#493736", "#7b3b3b", "#bbbb88", "#ccc68d", "#eedd99", "#eec290", "#eeaa88", "#b3cc57", "#ecf081", "#ffbe40", "#ef746f", "#ab3e5b", "#a3a948", "#edb92e", "#f85931", "#ce1836", "#009989", "#300030", "#480048", "#601848", "#c04848", "#f07241", "#67917a", "#170409", "#b8af03", "#ccbf82", "#e33258", "#aab3ab", "#c4cbb7", "#ebefc9", "#eee0b7", "#e8caaf", "#e8d5b7", "#0e2430", "#fc3a51", "#f5b349", "#e8d5b9", "#ab526b", "#bca297", "#c5ceae", "#f0e2a4", "#f4ebc3", "#607848", "#789048", "#c0d860", "#f0f0d8", "#604848", "#b6d8c0", "#c8d9bf", "#dadabd", "#ecdbbc", "#fedcba", "#a8e6ce", "#dcedc2", "#ffd3b5", "#ffaaa6", "#ff8c94", "#3e4147", "#fffedf", "#dfba69", "#5a2e2e", "#2a2c31", "#fc354c", "#29221f", "#13747d", "#0abfbc", "#fcf7c5", "#cc0c39", "#e6781e", "#c8cf02", "#f8fcc1", "#1693a7", "#1c2130", "#028f76", "#b3e099", "#ffeaad", "#d14334", "#a7c5bd", "#e5ddcb", "#eb7b59", "#cf4647", "#524656", "#dad6ca", "#1bb0ce", "#4f8699", "#6a5e72", "#563444", "#5c323e", "#a82743", "#e15e32", "#c0d23e", "#e5f04c", "#edebe6", "#d6e1c7", "#94c7b6", "#403b33", "#d3643b", "#fdf1cc", "#c6d6b8", "#987f69", "#e3ad40", "#fcd036", "#230f2b", "#f21d41", "#ebebbc", "#bce3c5", "#82b3ae", "#b9d3b0", "#81bda4", "#b28774", "#f88f79", "#f6aa93", "#3a111c", "#574951", "#83988e", "#bcdea5", "#e6f9bc", "#5e3929", "#cd8c52", "#b7d1a3", "#dee8be", "#fcf7d3", "#1c0113", "#6b0103", "#a30006", "#c21a01", "#f03c02", "#000000", "#9f111b", "#b11623", "#292c37", "#cccccc", "#382f32", "#ffeaf2", "#fcd9e5", "#fbc5d8", "#f1396d", "#e3dfba", "#c8d6bf", "#93ccc6", "#6cbdb5", "#1a1f1e", "#f6f6f6", "#e8e8e8", "#333333", "#990100", "#b90504", "#1b325f", "#9cc4e4", "#e9f2f9", "#3a89c9", "#f26c4f", "#a1dbb2", "#fee5ad", "#faca66", "#f7a541", "#f45d4c", "#c1b398", "#605951", "#fbeec2", "#61a6ab", "#accec0", "#5e9fa3", "#dcd1b4", "#fab87f", "#f87e7b", "#b05574", "#951f2b", "#f5f4d7", "#e0dfb1", "#a5a36c", "#535233", "#8dccad", "#988864", "#fea6a2", "#f9d6ac", "#ffe9af", "#2d2d29", "#215a6d", "#3ca2a2", "#92c7a3", "#dfece6", "#413d3d", "#040004", "#c8ff00", "#fa023c", "#4b000f", "#eff3cd", "#b2d5ba", "#61ada0", "#248f8d", "#605063", "#ffefd3", "#fffee4", "#d0ecea", "#9fd6d2", "#8b7a5e", "#cfffdd", "#b4dec1", "#5c5863", "#a85163", "#ff1f4c", "#9dc9ac", "#fffec7", "#f56218", "#ff9d2e", "#919167", "#4e395d", "#827085", "#8ebe94", "#ccfc8e", "#dc5b3e", "#a8a7a7", "#cc527a", "#e8175d", "#474747", "#363636", "#f8edd1", "#d88a8a", "#474843", "#9d9d93", "#c5cfc6", "#046d8b", "#309292", "#2fb8ac", "#93a42a", "#ecbe13", "#f38a8a", "#55443d", "#a0cab5", "#cde9ca", "#f1edd0", "#a70267", "#f10c49", "#fb6b41", "#f6d86b", "#339194", "#ff003c", "#ff8a00", "#fabe28", "#88c100", "#00c176", "#ffedbf", "#f7803c", "#f54828", "#2e0d23", "#f8e4c1", "#4e4d4a", "#353432", "#94ba65", "#2790b0", "#2b4e72", "#0ca5b0", "#4e3f30", "#fefeeb", "#f8f4e4", "#a5b3aa", "#4d3b3b", "#de6262", "#ffb88c", "#ffd0b3", "#f5e0d3", "#fffbb7", "#a6f6af", "#66b6ab", "#5b7c8d", "#4f2958", "#edf6ee", "#d1c089", "#b3204d", "#412e28", "#151101", "#9d7e79", "#ccac95", "#9a947c", "#748b83", "#5b756c", "#fcfef5", "#e9ffe1", "#cdcfb7", "#d6e6c3", "#fafbe3", "#9cddc8", "#bfd8ad", "#ddd9ab", "#f7af63", "#633d2e", "#30261c", "#403831", "#36544f", "#1f5f61", "#0b8185", "#aaff00", "#ffaa00", "#ff00aa", "#aa00ff", "#00aaff", "#d1313d", "#e5625c", "#f9bf76", "#8eb2c5", "#615375", "#ffe181", "#eee9e5", "#fad3b2", "#ffba7f", "#ff9c97", "#73c8a9", "#dee1b6", "#e1b866", "#bd5532", "#373b44", "#805841", "#dcf7f3", "#fffcdd", "#ffd8d8", "#f5a2a2"]

/**
 *   Chart 1 - Number of articles per folder
 */
function report_countartperfolder(namefol, countarticles) {
    var ctx = document.getElementById('ch_art_fol');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: namefol,
            datasets: [{
                label: '# of Articles',
                data: countarticles,
                backgroundColor: colorpalette,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0
                    }
                }]
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 *   Chart 2 - Number of views per folder
 */
function report_counthitsperfolder(namefol, counthitsF, sumcounthitsF) {
  console.log(namefol)
  console.log(counthitsF)
    if (sumcounthitsF < 1) {}
    var ctx = document.getElementById('ch_hits_fol');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: namefol,
            datasets: [{
                label: '# of Views',
                fill: false,
                data: counthitsF,
                borderColor: colorpalette,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0
                    }
                }]
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 *   Chart 3 - Solutions in Draft status
 */
function report_draftsolutions(subdomain, farticles_d) {
    // necessary to load Gridjs html function (formatter)
    var {
        html
    } = gridjs;
    // generates table
    new gridjs.Grid({
        columns: [{
                name: "ID",
                id: "id"
            },
            {
                name: "Last Update (DD-MM)",
                id: "updated_at"
            },
            {
                name: "Title (Link)",
                id: "title",
                formatter: (_, row) =>
                    html(`<a target="_blank" href='https://${subdomain}/a/solutions/articles/${row.cells[0].data}'>${row.cells[2].data}</a>`)
            }
        ],
        data: farticles_d,
        language: {
            'pagination': {
                'showing': '🚧 Displaying',
                'results': () => 'Drafts'
            }
        },
        search: false,
        pagination: {
            enabled: true,
            limit: 5
        },
        sort: true
    }).render(document.getElementById("report_mostsuggested_table"));
}

/**
 *   Chart 4 - Solutions with User feedback
 */
function report_artuserfeedback(subdomain, farticles_f) {
  console.log(subdomain)
  console.log(farticles_f)
    // necessary to load Gridjs html function (formatter)
    var {
        html
    } = gridjs;
    // generates table
    new gridjs.Grid({
        columns: [{
                name: "ID",
                id: "id"
            },
            {
                name: "Last Update (DD-MM)",
                id: "updated_at"
            },
            {
                name: "Title (Link)",
                id: "title",
                formatter: (_, row) =>
                    html(`<a target="_blank" href='https://${subdomain}/a/solutions/articles/${row.cells[0].data}'>${row.cells[2].data}</a>`)
            }
        ],
        data: farticles_f,
        language: {
            'pagination': {
                'showing': '🔥 Displaying',
                'results': () => 'Active Feedbacks'
            }
        },
        search: false,
        pagination: {
            enabled: true,
            limit: 5
        },
        sort: true
    }).render(document.getElementById("report_artuserfeedback_table"));
}
