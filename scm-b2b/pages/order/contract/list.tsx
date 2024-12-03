import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { checkNumeric, cls, getToken } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Datepicker from 'react-tailwindcss-datepicker';
import Layout from '@/components/Layout';
import ListPagenation from '@/components/bbs/ListPagenation';
import {
    EditForm,
    EditFormTable,
    EditFormTH,
    EditFormTD,
    EditFormKeyword,
    EditFormDateRange,
    EditFormSubmitSearch,
    EditFormRadioList,
} from '@/components/UIcomponent/form/EditFormA';
import { ListTable, ListTableHead, ListTableBody, ListTableCaption, Callout } from '@/components/UIcomponent/table/ListTableA';

const OrderContractList: NextPage = (props: any) => {
    const nav_id = 11;
    const crumbs = ['상담내역', '계약내역'];
    const title_sub = '계약내역을 관리 합니다';
    const callout = [
        '<span class="text-red-500">개인정보는 서비스 제공 이외의 목적으로 사용을 금합니다.</span>',
        '저장 [상세보기]를 클릭하시면, 해당 계약의 상세내용 확인 및 수정을 할 수 있습니다.',
        '계약내역 [상세보기]를 클릭하시면, 해당 계약의 계약 제출 내용을 확인 할 수 있습니다.',
        '[처리상태 정의]',
        '임시저장 : 계약 내용을 임시저장한 상태',
        '계약완료 : 계약내용을 최종적으로 제출한 상태로써, 정산단계로 이동',
    ];

    const router = useRouter();
    const [filter, setFilter] = useState<any>({});
    const [params, setParams] = useState<any>({});
    const [posts, setPosts] = useState<any>([]);

    useEffect(() => {
        if (sessionStorage.getItem(router.asPath) || '{}' !== '{}') {
            setParams(JSON.parse(sessionStorage.getItem(router.asPath) || '{}').params);
            setPosts(JSON.parse(sessionStorage.getItem(router.asPath) || '{}').data);
            const scroll = checkNumeric(JSON.parse(sessionStorage.getItem(router.asPath) || '{}').scroll_y);
            let intervalRef = setInterval(() => {
                const page_contents: any = document.querySelector('#page_contents');
                page_contents.scrollTo(0, scroll);
                sessionStorage.removeItem(router.asPath);
                clearInterval(intervalRef);
            }, 200);
        } else {
            setFilter(props.response.filter);
            setParams(props.response.params);
            s.setValues(props.response.params.filters);
            getPagePost(props.response.params);
        }
    }, [router.asPath]);

    const getPagePost = async p => {
        let newPosts = await getPostsData(p);
        setPosts(newPosts.list);
    };

    const getPostsData = async p => {
        try {
            const { data } = await api.post(`/scm/b2b/center/order/contract/list`, p);
            setParams(data.params);
            return data;
        } catch (e: any) {}
    };

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

    const openContractDetail = async (ouid: number) => {
        router.push(`/order/contract/detail?uid=${ouid}`);
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <Callout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">계약완료일</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormDateRange input_name="create_at" values={s.values?.create_at} handleChange={fn.handleChangeDateRange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">처리상태</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormRadioList input_name="cont_state" values={s.values?.cont_state} filter_list={filter.cont_state} handleChange={fn.handleChange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">검색어</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormKeyword
                            skeyword_values={s.values?.skeyword}
                            skeyword_type_values={s.values?.skeyword_type}
                            skeyword_type_filter={filter.skeyword_type}
                            handleChange={fn.handleChange}
                            errors={s.errors}
                        ></EditFormKeyword>
                    </EditFormTD>
                </EditFormTable>
                <EditFormSubmitSearch button_name="조회하기" submitting={s.submitting}></EditFormSubmitSearch>
            </EditForm>
            <ListTableCaption>
                <div className="">
                    검색 결과 : 총 {params?.page_total}개 중 {posts?.length}개
                </div>
                <div className=""></div>
            </ListTableCaption>
            <ListTable>
                <ListTableHead>
                    <th>상세내용</th>
                    <th>처리상태</th>
                    <th>기업명</th>
                    <th>상담자명</th>
                    <th style={{ width: '400px' }}>서비스명</th>
                    <th>등록일</th>
                    <th>계약일</th>
                </ListTableHead>
                <ListTableBody>
                    {posts?.map((v: any, i: number) => (
                        <tr key={`list-table-${i}`} className="">
                            <td className="text-center">
                                <button type="button" className="btn-filter" onClick={() => openContractDetail(v.ouid)}>
                                    상세보기
                                </button>
                            </td>
                            <td className="">{v.cont_state}</td>
                            <td className="">{v.apply_company}</td>
                            <td className="">{v.apply_name}</td>
                            <td className="">{v.title}</td>
                            <td className="">{v.create_at}</td>
                            <td className="">{v.update_at}</td>
                        </tr>
                    ))}
                </ListTableBody>
            </ListTable>
            <ListPagenation props={params} getPagePost={getPagePost} />
        </Layout>
    );
};
export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {};
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/order/contract/init`, request);
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

export default OrderContractList;
