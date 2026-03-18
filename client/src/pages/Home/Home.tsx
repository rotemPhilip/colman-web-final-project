import "./Home.css";
import AppNavbar from "../../components/AppNavbar/AppNavbar";
import Feed from "../../features/feed/Feed";
import { useFeed } from "../../features/feed/useFeed";

const Home = () => {
  const feedState = useFeed();

  return (
    <div className="min-vh-100 bg-light">
      <AppNavbar filter={feedState.filter} onFilterChange={feedState.setFilter} />
      <Feed {...feedState} />
    </div>
  );
};

export default Home;
