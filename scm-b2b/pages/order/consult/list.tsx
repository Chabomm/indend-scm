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

const OrderConsultList: NextPage = (props: any) => {
    const nav_id = 10;
    const crumbs = ['상담내역', '상담내역'];
    const title_sub = '상담내역을 관리 합니다';
    const callout = [
        '<span class="text-red-500">개인정보는 서비스 제공 이외의 목적으로 사용을 금합니다.</span>',
        '<span class="text-red-500">서비스 상담 처리가 지연되어 발생되는 불이익은 파트너사의 책임이니 유의해주시기 바랍니다.</span>',
        '<span class="font-bold">[상세보기]를 클릭하시면, 상담 상세내용 확인 및 상담내역 기록을 할 수 있습니다.</span>',
        '[처리상태 정의]',
        '신규 상담 : 상담을 진행하지 않은 상태',
        '상담중 : 상담 진행중인 상태',
        '진행보류 : 상담 컨설팅 완료 후, 계약을 보류한 기업',
        '계약미진행 : 상담 이후 계약 불발',
        '계약완료 : 상담 이후 계약 성사',
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
            const { data } = await api.post(`/scm/b2b/center/order/consult/list`, p);
            setParams(data.params);
            return data;
        } catch (e: any) {}
    };

    const { s, fn } = useForm({
        onSubmit: async () => {
            await searching();
        },
    });

    const searching = async () => {
        params.filters = s.values;
        let newPosts = await getPostsData(params);
        setPosts(newPosts.list);
    };

    const openConsultDetail = async (ouid: number) => {
        const page_contents: any = document.querySelector('#page_contents');
        sessionStorage.setItem(
            router.asPath,
            JSON.stringify({
                data: posts,
                params: params,
                scroll_x: `${page_contents.scrollLeft || 0}`,
                scroll_y: `${page_contents.scrollTop || 0}`,
            })
        );
        router.push(`/order/consult/detail?uid=${ouid}`);
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <Callout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">상담신청일</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormDateRange className={''} input_name="create_at" values={s.values?.create_at} handleChange={fn.handleChangeDateRange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">처리상태</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormRadioList input_name="state" values={s.values?.state} filter_list={filter.state} handleChange={fn.handleChange} errors={s.errors} />
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
                    <th>기업코드</th>
                    <th>기업명</th>
                    <th>카테고리</th>
                    <th style={{ width: '300px' }}>서비스명</th>
                    <th>상담자명</th>
                    <th>직급/직책</th>
                    <th>연락처</th>
                    <th>등록일</th>
                    <th>최근상담</th>
                </ListTableHead>
                <ListTableBody>
                    {posts?.map((v: any, i: number) => (
                        <tr key={`list-table-${i}`} className="">
                            <td className="text-center">
                                <button type="button" className="btn-filter" onClick={() => openConsultDetail(v.uid)}>
                                    상세보기
                                </button>
                            </td>
                            <td className="">{v.state}</td>
                            <td className="">{v.seller_id}</td>
                            <td className="">{v.apply_company}</td>
                            <td className="">{v.category}</td>
                            <td className="">{v.title}</td>
                            <td className="">{v.apply_name}</td>
                            <td className="">{v.apply_position}</td>
                            <td className="">{v.apply_phone}</td>
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
        const { data } = await api.post(`/scm/b2b/center/order/consult/init`, request);
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

export default OrderConsultList;
