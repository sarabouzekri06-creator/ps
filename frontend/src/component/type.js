const Type=()=>{

    return(
       <>
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
    
    <div 
      className="card shadow-lg p-5"
      style={{ width: "450px", borderRadius: "20px" }}
    >
      
      <h4 className="text-center mb-4">Choisissez votre rôle</h4>

      <div className="d-flex justify-content-around">

        {/* Patient */}
        <div className="text-center">
          <div 
            className="rounded-circle border d-flex justify-content-center align-items-center mb-3"
            style={{
              width: "100px",
              height: "100px",
              border: "3px solid #0d6efd",
              transition: "0.3s"
            }}
          >
            👤
          </div>

          <button className="btn btn-primary px-4">
            Patient
          </button>
        </div>

        {/* Responsable */}
        <div className="text-center">
          <div 
            className="rounded-circle border d-flex justify-content-center align-items-center mb-3"
            style={{
              width: "100px",
              height: "100px",
              border: "3px solid #198754",
              transition: "0.3s"
            }}
          >
            🧑‍💼
          </div>

          <button className="btn btn-success px-4">
            Responsable
          </button>
        </div>

      </div>

    </div>
  </div>
</>
    )
}
export default Type