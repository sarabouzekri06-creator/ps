 import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg  navbar-light w-100"
      style={{ background: "rgb(255, 255, 255)" }}
    >
      <div className="container-fluid  px-3 ">

        <Link className="navbar-brand fw-bold text-primary fs-3" to="/acceuil">
                   <i className="bi bi-heart-pulse-fill me-2"></i>REMEMBER
                 </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Liens */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">

            <li className="nav-item ">
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/MedicationList">
                 Medicaments
              </Link>
            </li>

             <li className="nav-item">
              <Link className="nav-link" to="/MesureDashboard">
                 Mesures
              </Link>
            </li>

            <li className="nav-item ms-lg-2">
               <div className="d-flex gap-3">
                <Link to={"/Notification"} >

              <button className="btn btn-outline-light">
                🔔
              </button>
                </Link>
<Link to={"/Profile"} >

              <img
                src="./images/avatar.png"
                className="rounded-circle "
                style={{ maxWidth: "50px" }} 
              />
</Link>

            </div>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;