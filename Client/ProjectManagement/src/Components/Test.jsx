import React, { useState } from 'react'

function Test() {
    const [userName,setUserName] = useState();
  return (
    <>
        <input value={userName} onChange={(e)=>setUserName(e.target.value)} />
        <br />
        <span>{userName}</span>
    </>
  )
}

export default Test