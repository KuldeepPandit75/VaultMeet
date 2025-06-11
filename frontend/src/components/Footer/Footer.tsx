"use client"

import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import Link from 'next/link';

export default function Footer() {
    const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

    return (
        <footer className="w-full mt-[50px]" style={{ backgroundColor: `${secondaryAccentColor}20` }}>
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold" style={{ color: secondaryAccentColor }}>Vault<span style={{ color: primaryAccentColor }}>Meet</span></h3>
                        <p className="text-gray-600">
                            Host & Join Hackathons in a 2D Virtual World. Connect, collaborate, and create amazing projects.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://twitter.com/vaultmeet" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity text-white">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://linkedin.com/company/vaultmeet" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity text-white">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a href="https://github.com/vaultmeet" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity text-white">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4" style={{ color: primaryAccentColor }}>Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/events" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Upcoming Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/host" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Host a Hackathon
                                </Link>
                            </li>
                            <li>
                                <Link href="/news" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    News & Updates
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4" style={{ color: primaryAccentColor }}>Resources</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/support" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Support
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4" style={{ color: primaryAccentColor }}>Stay Updated</h4>
                        <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest updates and events.</p>
                        <form className="space-y-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                            <button
                                type="submit"
                                className="w-full px-4 py-2 rounded-lg text-white font-medium transition-colors"
                                style={{ backgroundColor: primaryAccentColor }}
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 text-sm">
                            © {new Date().getFullYear()} vaultmeet. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="/cookies" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}