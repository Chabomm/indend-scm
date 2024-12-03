import Link from 'next/link';
import type { NextPage } from 'next';
import React from 'react';
import Layout from '@/components/Layout';

const Home: NextPage = () => {
    return (
        <div className="h-screen overflow-hidden">
            <div className="h-screen overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <div className="font-bold">인디앤드코리아 입점시스템</div>
                    <Link href="/dream/counsel" className="underline text-blue-600">
                        <i className="fas fa-link me-3"></i>복지드림 상담 문의
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
