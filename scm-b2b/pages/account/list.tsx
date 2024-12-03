import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { checkNumeric, num2Cur } from '@/libs/utils';
import useForm from '@/components/form/useForm';
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

const AccountList: NextPage = (props: any) => {
    const nav_id = 12;
    const crumbs = ['정산관리', '정산내역'];
    const title_sub = '정산내역을 관리 합니다';
    const callout = [
        '정산일 이후 미입금건에 관하여 담당자에게 이메일 or 유선으로 확인절차가 진행되오니, 참고바랍니다.',
        '<span class="text-red-500">(주)인디앤드코리아 수수료 입금 계좌 번호 : 하나은행 012-34-56789, (주)인디앤드코리아</span>',
        '계약코드를 클릭하면 정산처리상태 내역을 확인할 수 있습니다.',
        '<span class="text-red-500">정산 수수료는 부가세(VAT)를 포함한 금액입니다.</span>',
        '[처리상태 정의]',
        '정산완료 : 수수료 정산이 완료된 상태',
        '정산대기 : 계약제출을 완료한 상태로써 정산일(매월 10일)이 되지 않아 미정산인 상태',
        '전체취소 : 정산일이 되기 전 계약이 전체 취소된 상태',
        '부분취소 : 정산일이 되기 전 계약이 부분 취소된 상태',
        '전체환불 : 정산일 이후 계약이 전체 취소되어 수수료를 환불받아야 하는 상태',
        '부분환불 : 정산일 이후 계약이 부분 취소되어 수수료를 환불받아야 하는 상태',
        '환불대기 : 정산일이 되기 전 수수료 환불 처리를 대기하고 있는 상태',
        '환불완료 : 수수료 환불이 완료된 상태',
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
            const { data } = await api.post(`/scm/b2b/center/order/account/list`, p);
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

    const openAccountDetail = async (auid: number) => {
        router.push(`/account/detail?uid=${auid}`);
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <Callout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">등록일</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormDateRange input_name="create_at" values={s.values?.create_at} handleChange={fn.handleChangeDateRange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">정산일</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormDateRange input_name="account_at" values={s.values?.account_at} handleChange={fn.handleChangeDateRange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">처리상태</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormRadioList
                            input_name="account_state"
                            values={s.values?.account_state}
                            filter_list={filter.account_state}
                            handleChange={fn.handleChange}
                            errors={s.errors}
                        />
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
                    <th>정산일자</th>
                    <th>정산상태</th>
                    <th>구매자명</th>
                    <th>판매담당자명</th>
                    <th>서비스명</th>
                    <th>계약일</th>
                    <th>계약금액</th>
                    <th>정산금액</th>
                    <th>세금계산서발행</th>
                    <th>등록일</th>
                </ListTableHead>
                <ListTableBody>
                    {posts?.map((v: any, i: number) => (
                        <tr key={`list-table-${i}`} className="">
                            <td className="text-center">
                                <button type="button" className="btn-filter" onClick={() => openAccountDetail(v.ouid)}>
                                    상세보기
                                </button>
                            </td>
                            <td className="">{v.account_date}</td>
                            <td className="">{v.account_state}</td>
                            <td className="">{v.apply_name}</td>
                            <td className="">{v.cont_staff_name}</td>
                            <td className="">{v.title}</td>
                            <td className="">{v.contract_date}</td>
                            <td className="">{num2Cur(v.contract_price)}</td>
                            <td className="">{num2Cur(v.account_price)}</td>
                            <td className="">{v.tax_invoice_date == null ? '미발행' : '발행'}</td>
                            <td className="">{v.create_at}</td>
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
        const { data } = await api.post(`/scm/b2b/center/order/account/init`, request);
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

export default AccountList;
