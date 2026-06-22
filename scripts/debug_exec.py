import sqlite3,json
c=sqlite3.connect("/home/node/.n8n/database.sqlite")
r=c.cursor()
r.execute("SELECT executionId,data FROM execution_data ORDER BY executionId DESC LIMIT 1")
row=r.fetchone()
if not row:
    print("No executions")
else:
    print("ExecID:", row[0])
    d=json.loads(row[1])
    rd=d.get("resultData",{})
    print("LastNode:", rd.get("lastNodeExecuted","?"))
    e=rd.get("error")
    if e:
        print("Error:", str(e.get("message",""))[:500])
        print("Node:", e.get("node",{}).get("name","?") if isinstance(e.get("node"),dict) else e.get("node","?"))
    else:
        print("No top-level error")
    for nname,runs in rd.get("runData",{}).items():
        for run in runs:
            if run.get("error"):
                print("NODE_ERR", nname, str(run["error"].get("message",""))[:300])
c.close()
