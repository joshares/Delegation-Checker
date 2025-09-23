// components/Footer.tsx

const Footer = () => {
  return (
    <footer className="w-full font-mono mt-20 py-8 border-t border-white/10">
      <div className="max-w-[1500px] mx-auto px-4 text-center">
        <p className="text-sm text-gray-400">
          For inquiries or support, please contact:{" "}
          <a
            href="mailto:Joshares9991@gmail.com"
            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-400 hover:to-purple-300 transition-all duration-300"
          >
            Joshares9991@gmail.com
          </a>
        </p>
        <p className="text-xs text-gray-600 mt-4">
          © {new Date().getFullYear()} Delegation Checker. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
