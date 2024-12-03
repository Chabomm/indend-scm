import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function Layout({ children }) {
    return (
        <div className="bg-primary">
            <Header />
            <div>{children}</div>
            <Footer />
        </div>
    );
}
