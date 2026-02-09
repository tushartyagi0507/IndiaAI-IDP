import { Linkedin, Globe, MapPin } from "lucide-react"; // Optional: lucide-react for icons

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Brand Section */}
        <div className="flex flex-col items-center md:items-start space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/neuralix-logo.jpeg" 
              alt="Neuralix.ai Logo" 
              className="h-10 w-auto rounded-md"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">Neuralix.ai</span>
          </div>
          <p className="text-sm text-slate-500 max-w-xs text-center md:text-left">
            Advancing the future of intelligence through innovative AI solutions.
          </p>
        </div>

        {/* Contact & Links */}
        <div className="flex flex-col items-center md:items-end space-y-3">
          <div className="flex items-center space-x-2 text-slate-600">
            <MapPin size={16} />
            <address className="not-italic text-sm">
            579, 32nd D Cross, 10th Main, 4th Block, Jayanagar, Bengaluru, Karnataka 560011
            </address>
          </div>
          
          <div className="flex space-x-6 pt-2">
            <a 
              href="https://neuralix.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Globe size={18} /> Website
            </a>
            <a 
              href="https://www.linkedin.com/company/neuralixailtd/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-700 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Linkedin size={18} /> LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Neuralix.ai. All rights reserved.
        </p>
      </div>
    </footer>
  );
};