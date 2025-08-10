import { useLocation } from "wouter";
import { FaEnvelope, FaPhone, FaShieldAlt, FaTachometerAlt, FaUsers, FaTrophy, FaMicrochip, FaCode, FaTools, FaCogs, FaMapMarkerAlt, FaGlobe, FaSignInAlt, FaRocket, FaSearch } from "react-icons/fa";

export default function SimpleDashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-blue-700">New Taj Electronics</span>
              <p className="text-xs text-gray-500 mt-1">Professional Business Solutions</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-gray-600 text-sm">
            <span className="flex items-center gap-2 hover:text-blue-700 transition-colors">
              <FaEnvelope className="text-blue-500" /> tajdwss@gmail.com
            </span>
            <span className="flex items-center gap-2 hover:text-blue-700 transition-colors">
              <FaPhone className="text-blue-500" /> +91-9893073666
            </span>
          </div>
          <button
            className="ml-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 text-sm flex items-center gap-2 shadow-sm"
            onClick={() => setLocation("/login")}
          >
            <FaSignInAlt /> Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-10 pb-10 bg-gradient-to-b from-blue-50 to-white min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium text-sm border border-blue-200 mb-8">
              <FaShieldAlt /> VERIFIED BUSINESS PARTNER
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
              Transform Your Business with <span className="text-blue-700">Modern Technology</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Your trusted partner for electronics sales, service, and smart business solutions. We deliver innovative CRM software and custom business tools to streamline your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                className="btn-primary flex items-center gap-2 px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-md"
                onClick={() => setLocation("/customer-service-request")}
              >
                <FaRocket /> Service Request
              </button>
              <button
                className="btn-secondary flex items-center gap-2 px-8 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-lg hover:border-blue-500 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                onClick={() => setLocation("/customer-search")}
              >
                <FaSearch /> Customer Management
              </button>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaShieldAlt className="text-2xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg text-center">Secure & Reliable</h3>
                <p className="text-gray-600 text-sm text-center">Enterprise-grade security protocols ensuring your business data remains protected at all times</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaTachometerAlt className="text-2xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg text-center">High Performance</h3>
                <p className="text-gray-600 text-sm text-center">Lightning-fast solutions optimized for maximum efficiency and productivity</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaUsers className="text-2xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg text-center">Expert Team</h3>
                <p className="text-gray-600 text-sm text-center">Certified professionals with years of experience in business technology solutions</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaTrophy className="text-2xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg text-center">Award Winning</h3>
                <p className="text-gray-600 text-sm text-center">Recognized excellence in service delivery and customer satisfaction</p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow hover:shadow-lg transition">
                <div className="text-4xl font-extrabold text-blue-700 mb-2">500+</div>
                <div className="text-gray-6
                00 uppercase tracking-wider text-sm font-semibold">Projects Completed</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow hover:shadow-lg transition">
                <div className="text-4xl font-extrabold text-blue-700 mb-2">98%</div>
                <div className="text-gray-600 uppercase tracking-wider text-sm font-semibold">Client Satisfaction</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow hover:shadow-lg transition">
                <div className="text-4xl font-extrabold text-blue-700 mb-2">24/7</div>
                <div className="text-gray-600 uppercase tracking-wider text-sm font-semibold">Support Available</div>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Our Professional Services</h2>
            <p className="text-center text-gray-600 mb-10 text-base max-w-2xl mx-auto">Comprehensive solutions designed to elevate your business operations and drive growth</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow hover:shadow-lg transition">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border border-blue-200">
                  <FaMicrochip className="text-3xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Electronics Sales & Service</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Premium electronics and professional repair services with comprehensive warranty support and genuine parts replacement.</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow hover:shadow-lg transition">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border border-blue-200">
                  <FaCode className="text-3xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">CRM Software Development</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Custom CRM solutions tailored to your business workflow with advanced analytics and comprehensive reporting features.</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow hover:shadow-lg transition">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border border-blue-200">
                  <FaTools className="text-3xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Repair Management Solutions</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Streamlined repair tracking and management systems with real-time status updates and intelligent inventory control.</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow hover:shadow-lg transition">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border border-blue-200">
                  <FaCogs className="text-3xl text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Custom Business Tools</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Tailored software solutions for business automation, process optimization, and digital transformation initiatives.</p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Get In Touch</h2>
            <p className="text-gray-600 mb-8 text-base max-w-xl mx-auto">Ready to transform your business? Contact our professional team today for personalized solutions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaEnvelope className="text-2xl text-blue-700" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Email</h4>
                <a href="mailto:tajdwss@gmail.com" className="text-gray-600 hover:text-blue-700 transition">tajdwss@gmail.com</a>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaPhone className="text-2xl text-blue-700" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Phone</h4>
                <a href="tel:+919893073666" className="text-gray-600 hover:text-blue-700 transition">+91-9893073666</a>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaMapMarkerAlt className="text-2xl text-blue-700" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Location</h4>
                <span className="text-gray-600">Dewas, MP, India</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <FaGlobe className="text-2xl text-blue-700" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Website</h4>
                <a href="https://tajdws.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700 transition">tajdws.com</a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                className="btn-primary flex items-center gap-2 px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-md"
                onClick={() => setLocation("/customer-service-request")}
              >
                <FaRocket /> Get Started
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gray-200 text-gray-600 text-sm bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">New Taj Electronics</span>
            </div>
            <div className="text-gray-500">&copy; 2025 New Taj Electronics. All Rights Reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}