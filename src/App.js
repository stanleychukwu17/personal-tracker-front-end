import {useState, useEffect} from 'react'
const monthNames = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
const yearArr = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]

//--start-- helper functions
// mufasa is a mini redux, that helps us manage the mini state of whatever select or input element that changes
const mufasa = (event, gl, wch) => {
    let slt_id = Number(event.target.id), val = event.target.value, obj = [];

    obj = gl.map(ech => {
        if (ech.id === slt_id && wch === 'select_yes') { return {...ech, val} }
        else if (ech.id === slt_id && wch === 'hour_val') { return {...ech, 'hour_val':Number(val)} }
        else if (ech.id === slt_id && wch === 'mins_val') { return {...ech, 'mins_val':Number(val)} }
        return ech
    })

    return obj
}

// saves the goals completed for the date received
const saveTheGoalsNow = (obj) => {
    const {theDay, theMonth, theYear, goals, callback} = obj;
    let any_empties = false;
    if (theDay <= 0 || theMonth <= 0 || theYear <= 0) { alert('In-accurate date format received'); return false; }

    goals.forEach(ech => {
        if (ech.typ === 'select_time' && !ech.hour_val) { any_empties = true; return false; }
        else if (ech.typ === 'input_hours' && !ech.hour_val) { any_empties = true; return false; }
    })
    if (any_empties) { alert('Please check all of the hours input to confirm that they are as supposed to be'); return false; }

    return fetch('http://localhost:4000/save-this-archive/', {
        method: 'POST', headers: {'content-Type':'application/json'},
        body: JSON.stringify(obj)
    }).then(re => {
        window.location.reload();
    })
}

// loads all the viewer archieved goals
const loadArchievedGoals = (obj) => {
    const {m, y} = obj
    fetch('http://localhost:4000/get-archieved-goals/?' + new URLSearchParams({m, y})).then(re => re.json()).then(re => {
        console.log(re);
        obj.callback(c => { return {...c, ...re}}) })
}
//--end--

//--start-- helper components
const showProperMinutes = (tyme, wch) => {
    let ret = tyme, ext, mins = String(tyme).split('.')
    if (wch === 'select_time' && tyme < 12) { ext = 'am' } else if (wch === 'select_time' && tyme >= 12) { ext = 'pm' }
    if (wch === 'input_hours' || wch === 'stats') { ext = 'hr' }

    if (mins.length > 1) {
        let [m1, m2] = mins;
        m2 = (Number(m2) * .6).toFixed(0) // converting the decimal number back to minutes, so it is understandable to the reader
        if (m2 > 0) { ret = `${m1}:${m2}`; } else { ret = `${m1}`; }
    }
    return `${ret} ${ext}`;
}

// simple component that shows if the goal was passes or failed, or if it's just a timer goal
const PassedComponents = ({typ, typ_val, typ_hours}) => {
    let passed, failed, dtime, txt_write, klass = 'Dw1_pass';

    if (typ === 'select_yes') {
        if (typ_val === 'passed') { passed = true; } else { failed = true; klass += ' Dw1_fail'; }
        txt_write = typ_val;
    } else if (typ === 'select_time' || typ === 'input_hours' || typ === 'stats') {
        dtime = true; klass += ' Dw1_time';
        txt_write = showProperMinutes(typ_hours, typ); // shows the time properly
    }

    return (
        <div className={klass}>
            <div>
                {passed && <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> }
                {failed && <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                {dtime && <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            </div>
            <div>{txt_write}</div>
        </div>
    )
}

// each of the cards that shows monthly goals
const ThisMonthGoalsComponent = ({archievedGoals: ag}) => {
    const {msg, every_day} = ag;

    if (!msg) { return <div>Loading...</div> }

    const ech_card = every_day.map(ech => {
        if (ech.goals.length > 0) {

            let stats = []
            let {t1:Total_hours_worked, t2:Total_time_on_sit, t3:Time_lost_b4_start_work, t4:Time_lost_to_breaks, t5:Time_lost_to_distraction, t6:Overall_lost_hours} = ech.stats
            stats.push({title:'Total_hours_worked', Total_hours_worked})
            stats.push({title:'Total_time_on_sit', Total_time_on_sit})
            stats.push({title:'Time_lost_b4_start_work', Time_lost_b4_start_work})
            stats.push({title:'Time_lost_to_breaks', Time_lost_to_breaks})
            stats.push({title:'Time_lost_to_distraction', Time_lost_to_distraction})
            stats.push({title:'Overall_lost_hours', Overall_lost_hours})

            return (
                <div className=" Dw1_mnt_Ecd" key={ech.date}>
                    <div className="Dw1_mnt_TopM">
                        <div>{ech.d_shw}</div> <div>{ech.day}</div> <div></div>
                    </div>
                    <div className="Dw1_mnt_Mid">
                        {ech.goals.map( v1 => {
                            return (
                                <div className="Dw1_mnt_MEch" key={v1.typ_id}>
                                    <div>{v1.title}</div>
                                    <PassedComponents typ={v1.typ} typ_val={v1.typ_val} typ_hours={v1.typ_hours} />
                                </div>
                            )
                        })}
                        {stats.map( v1 => {
                            return (
                                <div className="Dw1_mnt_MEch" key={v1.title}>
                                    <div>{v1.title}</div>
                                    <PassedComponents typ='stats' typ_hours={v1[v1.title]} />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        } else {
            return ''
        }
    })

    return (
        <div className="Dw1_mnt_Cards">
            {ech_card}
        </div>
    )
}
//--end--


function App() {
    const d = new Date(), mont = d.getMonth() + 1, yay= d.getFullYear();
    const [goals, setGoals] = useState([])
    const [theDay, setTheDay] = useState(d.getDate())
    const [theMonth, setTheMonth] = useState(mont)
    const [theYear, setTheYear] = useState(yay)
    const [dShow, setDshow] = useState({'m': mont, 'y': yay})
    const [archievedGoals, setArchievedGoals] = useState({'msg':false})
    let slt_typ, onome = [];

    useEffect(() => {
        fetch('http://localhost:4000/get-the-goals/').then(re => re.json()).then(re => {
            if (re.rows.length > 0) { setGoals(re.rows) }
        })

        loadArchievedGoals({'m':theMonth, 'y':theYear, 'callback':setArchievedGoals})
    }, [])

    return (
        <div className="App">
            <div className="Hm_Hdr1">Hi Stanley!!! tell me it's good today</div>
            <div className="Hm_boxCvr">
                <div className="Hm_EMkdons">Ready for today's record?</div>
                <div className="Hm_Todays">
                    <select value={theDay} onChange={(e) => { setTheDay(Number(e.target.value)) }}>
                        {(() => { onome = []; for (let i = 1; i <= 31; i++) { onome.push(i); } })()}
                        {onome.map(ech => <option value={ech} key={ech}>{ech}</option>)}
                    </select>
                    <select value={theMonth} onChange={(e) => { setTheMonth(Number(e.target.value)) }}>{monthNames.map((ech, k) => <option value={k+1} key={ech}>{ech}</option>)}</select>
                    <select value={theYear} onChange={(e) => { setTheYear(Number(e.target.value)) }}>{yearArr.map(ech => <option value={ech} key={ech}>{ech}</option>)}</select>
                </div>
                <div className="Hm_EchCPops">
                    {goals.map(ech => {
                        if (ech.typ === 'select_yes') {
                            slt_typ = (
                                <select id={ech.id} onChange={(e) => { setGoals(mufasa(e, goals, 'select_yes')) }} value={ech.val || ech.def}>
                                    <option value="passed">passed</option><option value="failed">failed</option>
                                </select>
                            )
                        } else if (ech.typ === 'select_time') {
                            slt_typ = (
                                <div className="gbBb_4time">
                                    <input type="number" placeholder="24hour fmt" id={ech.id} onChange={(e) => { setGoals(mufasa(e, goals, 'hour_val')) }} value={ech.hour_val} min="1" max="24"/>
                                    <input type="number" placeholder="Minute" id={ech.id} onChange={(e) => { setGoals(mufasa(e, goals, 'mins_val')) }} value={ech.mins_val} min="1" max="60"/>
                                </div>
                            )
                        } else if (ech.typ === 'input_hours') {
                            slt_typ = <div className=""><input type="number" placeholder="How many hours" id={ech.id} onChange={(e) => { setGoals(mufasa(e, goals, 'hour_val')) }} value={ech.hour_val} min="1" max="24"/></div>
                        } else { slt_typ = '' }


                        return (
                            <div className="Hm_EchCCvr" key={ech.id}>
                                <div className="Hm_EchCd_1">{ech.title}</div>
                                <div className="Hm_EchCd_2">{slt_typ}</div>
                            </div>
                        )
                    })}
                </div>
                <div className="Hm_LstBtn"><button onClick={()=> {saveTheGoalsNow({theDay, theMonth, theYear, goals})}}>Save changes</button></div>
            </div>

            <div className="Dw1_mnthCvr">
                <div className=" Dw1_mnt_1c">
                    <div className="Dw1_mnt_1name">This month, so far!</div>
                    <div className="Dw1_mnt_1select">
                        <select value={dShow.m} onChange={(e) => { setDshow({...dShow, 'm':e.target.value}) }}>{monthNames.map((ech, k) => <option value={k+1} key={ech}>{ech}</option>)}</select>
                        <select value={dShow.y} onChange={(e) => { setDshow({...dShow, 'y':e.target.value}) }}>{yearArr.map(ech => <option value={ech} key={ech}>{ech}</option>)}</select>
                        <a href="/bufr.php" onClick={(e) => { e.preventDefault(); loadArchievedGoals({'m':dShow.m, 'y':dShow.y, 'callback':setArchievedGoals}) }}>Update result</a>
                    </div>
                </div>
                <ThisMonthGoalsComponent archievedGoals={archievedGoals} />
            </div>

            {archievedGoals.diff_month_stats && archievedGoals.diff_month_stats.map( zub => {
                return (
                    <div className="Ps1_OldBru" key={zub.month_name}>
                        <div className=""><h2>{zub.month_name}</h2></div>
                        <div className="PsssCover">
                            <div className="Ps1_mjCvr">
                                <div className="Ps1_hdrO">
                                    <div className="PsA Ps1_h1"><span>Goals and Activities</span></div>
                                    <div className="PsA Ps1_h2"><span>Count</span></div>
                                    <div className="PsA Ps1_h3"><span>Passed</span></div>
                                    <div className="PsA Ps1_h4"><span>Failed</span></div>
                                    <div className="PsA Ps1_h5"><span>Scores</span></div>
                                </div>
                                <div className="">
                                    {zub.a.map(ech => {
                                        return (
                                            <div className="P2ech_Cvr" key={ech.title}>
                                                <div className="P2ech_i Ps1_h1">{ech.title}</div>
                                                <div className="P2ech_i Ps1_h2">{ech.total}</div>
                                                <div className="P2ech_i Ps1_h3">{ech.passed}</div>
                                                <div className="P2ech_i Ps1_h4">{ech.failed}</div>
                                                <div className="P2ech_i Ps1_h5">
                                                    <div>{ech.scores}%</div>
                                                    {ech.scores >= 100 &&
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                                                        </svg>
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="ovr_scores">
                                    Overall score: &nbsp; 95%
                                </div>
                            </div>
                            <div className="Ps2_mjCvr">
                                <div className="Ps2_mDir">
                                    {zub.b.map(ech => {
                                        const avg = showProperMinutes(ech.avg, ech.typ || 'stats')
                                        return (
                                            <div className="P2ech_Cvr" key={ech.title}>
                                                <div className="P2ech_i Ps1_h6">{ech.title}</div>
                                                <div className="P2ech_i Ps1_h7">{avg}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="Ps2_mDir">
                                    {zub.c.map(ech => {
                                        const tot = showProperMinutes(ech.tot, ech.typ || 'stats')
                                        return (
                                            <div className="P2ech_Cvr" key={ech.title}>
                                                <div className="P2ech_i Ps1_h6">{ech.title}</div>
                                                <div className="P2ech_i Ps1_h7">{tot}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}

        </div>
    );
}

export default App;
