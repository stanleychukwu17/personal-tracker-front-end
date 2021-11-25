import {useState, useEffect} from 'react'

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

const saveTheGoalsNow = (obj) => {
    const {theDay, theMonth, theYear, goals} = obj;
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
        loadArchievedGoals()
    })
}

const loadArchievedGoals = (obj) => {
    fetch('http://localhost:4000/get-archieved-goals/').then(re => re.json()).then(re => {
        console.log(re);
        // if (re.rows.length > 0) { setGoals(re.rows) }
    })
}


function App() {
    const d = new Date();
    const [goals, setGoals] = useState([])
    const [theDay, setTheDay] = useState(d.getDate())
    const [theMonth, setTheMonth] = useState(d.getMonth() + 1)
    const [theYear, setTheYear] = useState(d.getFullYear())
    let slt_typ, onome = [];

    useEffect(() => {
        fetch('http://localhost:4000/get-the-goals/').then(re => re.json()).then(re => {
            if (re.rows.length > 0) { setGoals(re.rows) }
        })

        loadArchievedGoals({})
    }, [])

    return (
        <div className="App">
            <div className="Hm_Hdr1">Hi Stanley!!! tell me it's good today</div>
            <div className="Hm_boxCvr">
                <div className="Hm_EMkdons">Ready for today's record?</div>
                <div className="Hm_Todays">
                    <select value={theDay} onChange={(e) => { setTheDay(Number(e.target.value)) }}>
                        <option value="">Day</option>
                        {(() => { onome = []; for (let i = 1; i <= 31; i++) { onome.push(i); } })()}
                        {onome.map(ech => <option value={ech} key={ech}>{ech}</option>)}
                    </select>
                    <select value={theMonth} onChange={(e) => { setTheMonth(Number(e.target.value)) }}>
                        <option value="">Month</option>
                        {(() => { onome = []; for (let i = 1; i <= 12; i++) { onome.push(i); } })()}
                        {onome.map(ech => <option value={ech} key={ech}>{ech}</option>)}
                    </select>
                    <select value={theYear} onChange={(e) => { setTheYear(Number(e.target.value)) }}>
                        <option value="">Year</option>
                        {(() => { onome = []; for (let i = 2021; i <= (theYear+1); i++) { onome.push(i); } })()}
                        {onome.map(ech => <option value={ech} key={ech}>{ech}</option>)}
                    </select>
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
                                <div className="Hm_EchCd_2">
                                    {slt_typ}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="Hm_LstBtn"><button onClick={()=> {saveTheGoalsNow({theDay, theMonth, theYear, goals})}}>Save changes</button></div>
            </div>
        </div>
    );
}

export default App;
