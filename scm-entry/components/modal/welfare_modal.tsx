import React, { useEffect } from 'react';
import { api, setContext } from '@/libs/axios';

interface ModalProps {
    setWelfareModalOpen?: any;
    wuid?: number;
}
export default function WelfareModal({ setWelfareModalOpen, wuid }: ModalProps) {
    useEffect(() => {
        getWelfare();
    }, []);
    const getWelfare = async () => {
        try {
            const params = {
                uid: wuid,
            };
            const { data } = await api.post(`/be/front/partner/welfare/detail`, params);
        } catch (e: any) {}
    };
    const closeModal = () => {
        setWelfareModalOpen(false);
    };

    return (
        <>
            <div className="fixed z-50 top-0 w-full h-full">
                <div className="w-80 mt-[30%] m-auto max-w-sm">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none z-50">
                        <div className="flex justify-end px-5 pt-5 rounded-t">
                            <button className="text-red-500 text-sm " type="button" onClick={closeModal}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="relative p-6 pt-0 flex-auto divide-y">
                            <div className="p-3">hi</div>
                        </div>
                    </div>
                </div>
                <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={closeModal}></div>
            </div>
        </>
    );
}
