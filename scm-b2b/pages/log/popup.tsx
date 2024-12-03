import type { GetServerSideProps, NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import LayoutPopup from '@/components/LayoutPopup';
import ListPagenation from '@/components/bbs/ListPagenation';
import useForm from '@/components/form/useForm';
import ButtonSerach from '@/components/UIcomponent/ButtonSearch';
import Datepicker from 'react-tailwindcss-datepicker';
import { cls } from '@/libs/utils';

const LogPopup: NextPage = (props: any) => {
    const router = useRouter();
    const [filter, setFilter] = useState<any>({});
    const [params, setParams] = useState<any>({});
    const [posts, setPosts] = useState<any>([]);

    useEffect(() => {
        setFilter(props.response.filter);
        setParams(props.response.params);
        s.setValues(props.response.params.filters);
        getPagePost(props.response.params);
    }, []);

    const { s, fn } = useForm({
        initialValues: {},
        onSubmit: async () => {
            await searching();
        },
    });

    const searching = async () => {
        params.filters = s.values;

        let newPosts = await getPostsData(params);
        setPosts(newPosts.list);
    };

    const getPagePost = async p => {
        let newPosts = await getPostsData(p);
        setPosts(newPosts.list);
    };

    const getPostsData = async p => {
        try {
            const { data } = await api.post(`/scm/b2b/center/auth/log/list`, p);
            setParams(data.params);
            return data;
        } catch (e: any) {}
    };

    return (
        <LayoutPopup title={''}>
            {posts.length <= 0 ? (
                <div className="border p-24 m-24 text-center">로그 내역이 없습니다.</div>
            ) : (
                <div className="w-full bg-slate-100 mx-auto py-10">
                    <div className="px-9 mb-5">
                        <form onSubmit={fn.handleSubmit} noValidate className="w-full border py-4 px-6 rounded shadow-md bg-white mt-5 relative">
                            <div className="grid grid-cols-4 gap-6">
                                <div className="col-span-1">
                                    <div className="col-span-1">
                                        <label className="form-label">등록일</label>
                                        <Datepicker
                                            inputName="create_at"
                                            value={s.values?.create_at}
                                            i18n={'ko'}
                                            onChange={fn.handleChangeDateRange}
                                            containerClassName="relative w-full text-gray-700 border border-gray-300 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-4">
                                    <select
                                        name="skeyword_type"
                                        value={s.values?.skeyword_type || ''}
                                        onChange={fn.handleChange}
                                        className={cls(s.errors['skeyword_type'] ? 'border-danger' : '', 'form-select mr-3')}
                                        style={{ width: 'auto' }}
                                    >
                                        <option value="">전체</option>
                                        {filter.skeyword_type?.map((v: any, i: number) => (
                                            <option key={i} value={v.key}>
                                                {v.text}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        name="skeyword"
                                        value={s.values?.skeyword || ''}
                                        placeholder=""
                                        onChange={fn.handleChange}
                                        className={cls(s.errors['skeyword'] ? 'border-danger' : '', 'form-control mr-3')}
                                        style={{ width: 'auto' }}
                                    />
                                    <ButtonSerach submitting={s.submitting}>
                                        <i className="fas fa-search mr-3" style={{ color: '#ffffff' }}></i> 검색
                                    </ButtonSerach>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="px-9">
                        <div className="mb-5 border py-4 px-6 rounded shadow-md bg-white relative">
                            <div className="flex mb-4 justify-between">
                                <div>
                                    <span className="font-bold">로그 내역</span>
                                    <span className="ms-3 text-sm text-gray-500">총 {posts.length}개</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className=" col-span-2 col-table">
                                    <div className="col-table-th grid grid-cols-9 bg-gray-100">
                                        <div className="">UID</div>
                                        <div className=" col-span-2">컬럼명</div>
                                        <div className="">전</div>
                                        <div className="">후</div>
                                        <div className="col-span-2">등록자</div>
                                        <div className="col-span-2">등록일</div>
                                    </div>

                                    {posts.map((v: any, i: number) => (
                                        <div key={i} className="col-table-td grid grid-cols-9 bg-white transition duration-300 ease-in-out hover:bg-gray-100">
                                            <div className="">{v.uid}</div>
                                            <div className="!justify-start col-span-2">{v.column_name}</div>
                                            <div className="break-all">{v.cl_before}</div>
                                            <div className="break-all">{v.cl_after}</div>
                                            <div className="col-span-2">{v.create_user}</div>
                                            <div className="col-span-2">{v.create_at}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <ListPagenation props={params} getPagePost={getPagePost} />
                </div>
            )}
        </LayoutPopup>
    );
};
export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {
        table_name: ctx.query.table_name,
        table_uid: ctx.query.table_uid,
    };
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/auth/log/init`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { request, response },
    };
};

export default LogPopup;
