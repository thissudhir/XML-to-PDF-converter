import Navbar from "./components/Navbar";
import PdfUploader from "./components/PdfUploader";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="mt-1">
        <PdfUploader />
      </div>
    </div>
  );
}
